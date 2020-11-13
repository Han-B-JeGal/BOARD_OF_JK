// 메인화면 출력파일
const  express = require('express');
const  ejs = require('ejs');
const   fs = require('fs');
const  router = express.Router();
var    loglevel = 1;

const  GetMainUI = (req, res) => {   // 메인화면 출력
let    htmlstream = ''; // 페이지 구성 목적으로 사용(header ~ footer까지, 현재 초기화로 아무것도 없는 상태)

   logging(loglevel, 'router.get() invoked!');

     // 메인화면 구현
   htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
   
   if (true) {  
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar.ejs','utf8');  
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/content.ejs','utf8');
      htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
   }

     res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200 == 성공

   if (req.session.auth) {  // true : 로그인 상태
      res.end(ejs.render(htmlstream,  {'title' : 'UuuU',
                                       'logurl': '/users/logout',
                                       'loglabel': '로그아웃',
                                       'regurl': '/users/profile',
                                       'reglabel':req.session.who }));  // 세션에 저장된 사용자명표시
      }
      else {
         res.end(ejs.render(htmlstream, {'title' : 'UuuU',
                                         'logurl': '/users/auth',
                                         'loglabel': '로그인',
                                         'regurl': '/users/reg',
                                         'reglabel':'회원가입' }));
      }
};

const logging = (level, logmsg) => {
       if (level != 0) {
         console.log(level, logmsg)
         loglevel++;
      }
}

// ‘/’ get 메소드의 핸들러를 정의
router.get('/', GetMainUI);

// 외부로 뺍니다.
module.exports = router
