/* AI 스피킹하기: 서버(Supabase Edge Function) 주소와 호출 도우미
   비밀번호와 AI 키는 서버에만 있어요. 여기에는 비밀이 없어요. */
(function () {
  "use strict";
  var URL = "https://kcyjhwkrwlclgpsdshdm.supabase.co/functions/v1/talk-ai";
  function call(body) {
    return fetch(URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { j.status = res.status; return j; }); })
      .catch(function () { return { error: "network" }; });
  }
  window.TalkAI = { URL: URL, PW_KEY: "talk-ai-pw", call: call };
})();
