// deno.landに公開されているモジュールをimport
// denoではURLを直に記載してimportできます
import { serveDir } from "https://deno.land/std@0.223.0/http/file_server.ts";

// 直前の単語を保持しておく
let wordHistories = ["しりとり"];
let turn = 0;
let totalWordCount = wordHistories[wordHistories.length - 1].length;
let score = turn*10+totalWordCount;

// localhostにDenoのHTTPサーバーを展開
Deno.serve(async (request) => {
    // パス名を取得する
    // http://localhost:8000/hoge に接続した場合"/hoge"が取得できる
    const pathname = new URL(request.url).pathname;
    console.log(`pathname: ${pathname}`);

    // GET /shiritori: 直前の単語を返す
    if (request.method === "GET" && pathname === "/shiritori") {
        return new Response(wordHistories[wordHistories.length - 1]);
    }
    // POST /shiritori: 次の単語を入力する
    if (request.method === "POST" && pathname === "/shiritori") {
        // リクエストのペイロードを取得
        const requestJson = await request.json();
        // JSONの中からnextWordを取得
        const nextWord = requestJson["nextWord"];
 
        // previousWordの末尾とnextWordの先頭が同一か確認
        if (wordHistories[wordHistories.length - 1].slice(-1) === nextWord.slice(0, 1)) {
            // 末尾が「ん」になっている場合
            // ifの中に入力された単語の末尾が「ん」になっていることを確認する条件式を追加
            if (nextWord.slice(-1)=="ん") {
                // エラーを返す処理を追加
                // errorCodeを固有のものにして、末尾が「ん」の時に発生したエラーだとWeb側に通知できるようにする
                return new Response(
                    JSON.stringify({
                        "errorMessage": "単語の最後が\"ん\"だったので終了します。",
                        "errorCode": "10002",
                        "wordData":wordHistories.pop(nextWord),
                        "turn":turn,
                        "totalWordCount":totalWordCount,
                        "score":score,
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }
            const includes = wordHistories.includes(nextWord);
            if (includes == true) {
                // エラーを返す処理を追加
                // errorCodeを固有のものにして、末尾が「ん」の時に発生したエラーだとWeb側に通知できるようにする
                return new Response(
                    JSON.stringify({
                        "errorMessage": "同じ単語を再使用したため終了します。",
                        "errorCode": "10003",
                        "wordData":wordHistories.pop(nextWord),
                        "turn":turn,
                        "totalWordCount":totalWordCount,
                        "score":score,
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }
            // 同一であれば、previousWordを更新
            wordHistories.push(nextWord);
            turn=turn+1;
            totalWordCount =totalWordCount+wordHistories[wordHistories.length - 1].length;
            score = turn*10+totalWordCount;
        }
        // 同一でない単語の入力時に、エラーを返す
        else {
                return new Response(
                    JSON.stringify({
                        "errorMessage": "前の単語に続いていません",
                        "errorCode": "10001"
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }
        // 現在の単語を返す
        return new Response(wordHistories[wordHistories.length - 1]);
    } 

    // POST /reset: リセットする
    // request.methodとpathnameを確認
    if (request.method === "POST" && pathname === "/reset") {
        // 既存の単語の履歴を初期化する
        wordHistories=["しりとり"];
        turn = 0;
        totalWordCount = wordHistories[wordHistories.length - 1].length;
        score = turn*10+totalWordCount;
        return new Response(wordHistories);
    }
    
    // ./public以下のファイルを公開
    return serveDir(
        request,
        {
            /*
            - fsRoot: 公開するフォルダを指定
            - urlRoot: フォルダを展開するURLを指定。今回はlocalhost:8000/に直に展開する
            - enableCors: CORSの設定を付加するか
            */
            //fsRoot: "./public/",
            fsRoot: "kadai_site/public/index.html",
            urlRoot: "",
            enableCors: true,
        }
    );
});
