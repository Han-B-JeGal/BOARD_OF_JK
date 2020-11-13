const   fs = require('fs');
const   express = require('express');
const   ejs = require('ejs');
var   mysql = require('mysql');
const   bodyParser = require('body-parser');
const   session = require('express-session');
const   router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));

var   db = mysql.createConnection({
  host: 'localhost',        // DB서버 IP주소
//  port: '52272',               // DB서버 Port주소
  user: 'root',         // DB접속 아이디
  password: '123456',    // DB암호
  database: 'testDB'        //사용할 DB명
});
db.connect();


//  -----------------------------------  회원가입기능 -----------------------------------------
// 회원가입 입력양식을 브라우져로 출력합니다.
const PrintRegistrationForm = (req, res) => {
  let    htmlstream = '';

       htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar2.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/reg_form.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
       res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

       if (req.session.auth) {  // true :로그인된 상태,  false : 로그인안된 상태
           res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                             'logurl': '/users/logout',
                                             'loglabel': '로그아웃',
                                             'regurl': '/users/profile',
                                             'reglabel':req.session.who }));
       }
       else {
          res.end(ejs.render(htmlstream, { 'title' : '쇼핑몰site',
                                          'logurl': '/users/auth',
                                          'loglabel': '로그인',
                                          'regurl': '/users/reg',
                                          'reglabel':'회원가입' }));
       }

};

// 회원가입 양식에서 입력된 회원정보를 신규등록(DB에 저장)합니다.
const HandleRegistration = (req, res) => {  // 회원가입
   let body = req.body;
   let htmlstream='';
   db.connect();

    // 임시로 확인하기 위해 콘솔에 출력해봅니다.
    console.log(body.uid);
    console.log(body.pw1);
    console.log(body.uname);
    console.log(body.uphone);
    console.log(body.uaddress);
    console.log(body.ubirth);

    if (body.uid == '' || body.pw1 == '') {
         console.log("데이터입력이 되지 않아 DB에 저장할 수 없습니다.");
         res.status(561).end('<meta charset="utf-8">데이터가 입력되지 않아 가입을 할 수 없습니다');
    }
    else{
       db.query('INSERT INTO u18_users (uid, pass, name, phone, address, birth) VALUES (?, ?, ?, ?, ?, ?);', [body.uid, body.pw1, body.uname, body.uphone, body.uaddress, body.ubirth], (error, results, fields) => {
          if (error) {
            console.log(error);
            htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                               'warn_title':'회원가입 오류',
                               'warn_message':'이미 회원으로 등록되어 있습니다. 바로 로그인을 하시기 바랍니다.',
                               'return_url':'/' }));
          } else {
           console.log("회원가입에 성공하였으며, DB에 신규회원으로 등록하였습니다.!");
           res.redirect('/');
          }
       });

    }
};

// REST API의 URI와 핸들러를 매핑합니다.
router.get('/reg', PrintRegistrationForm);   // 회원가입화면을 출력처리
router.post('/reg', HandleRegistration);   // 회원가입내용을 DB에 등록처리
router.get('/', function(req, res) { res.send('respond with a resource 111'); });

// ------------------------------------  로그인기능 --------------------------------------

// 로그인 화면을 웹브라우져로 출력합니다.
const PrintLoginForm = (req, res) => {
  let    htmlstream = '';
  db.connect();

       htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar2.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/login_form.ejs','utf8');
       htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
       res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

       if (req.session.auth) {  // true :로그인된 상태,  false : 로그인안된 상태
           res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                             'logurl': '/users/logout',
                                             'loglabel': '로그아웃',
                                             'regurl': '/users/profile',
                                             'reglabel': req.session.who }));
       }
       else {
          res.end(ejs.render(htmlstream, { 'title' : '쇼핑몰site',
                                          'logurl': '/users/auth',
                                          'loglabel': '로그인',
                                          'regurl': '/users/reg',
                                          'reglabel':'회원가입' }));
       }

};

// 로그인을 수행합니다. (사용자인증처리)
const HandleLogin = (req, res) => {
  let body = req.body;
  let userid, userpass, username, userphone, useraddress, userbirth;
  let sql_str;
  let htmlstream = '';
  db.connect();

      console.log(body.uid);
      console.log(body.pass);
      if (body.uid == '' || body.pass == '') {
         console.log("아이디나 암호가 입력되지 않아서 로그인할 수 없습니다.");
         res.status(562).end('<meta charset="utf-8">아이디나 암호가 입력되지 않아서 로그인할 수 없습니다.');
      }
      else {
       sql_str = "SELECT uid, pass, name, phone, address, birth from u18_users where uid ='"+ body.uid +"' and pass='" + body.pass + "';";
       console.log("SQL: " + sql_str);
       db.query(sql_str, (error, results, fields) => {
         if (error) { res.status(562).end("Login Fail as No id in DB!"); }
         else {
            if (results.length <= 0) {  // select 조회결과가 없는 경우 (즉, 등록계정이 없는 경우)
                  htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                  res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                     'warn_title':'로그인 오류',
                                     'warn_message':'등록된 계정이나 암호가 틀립니다.',
                                     'return_url':'/' }));
             } else {  // select 조회결과가 있는 경우 (즉, 등록사용자인 경우)
               results.forEach((item, index) => {
                  userid = item.uid;  userpass = item.pass; username = item.name; userphone = item.phone; useraddress = item.address; userbirth = item.birth; userpoint = item.point;
                  console.log("DB에서 로그인성공한 ID/암호:%s/%s", userid, userpass);
                  if (body.uid == userid && body.pass == userpass) {
                     req.session.auth = 99;      // 임의로 수(99)로 로그인성공했다는 것을 설정함
                     req.session.who = username; // 인증된 사용자명 확보 (로그인후 이름출력용)
                     req.session.uid = userid;
                     req.session.pass = userpass;
                     req.session.name = username;
                     req.session.phone = userphone;
                     req.session.address = useraddress;
                     req.session.birth = userbirth;
                     // if (body.uid == 'admin@naver.com')    // 만약, 인증된 사용자가 관리자(admin)라면 이를 표시
                     //      req.session.admin = true;
                     // res.redirect('/');
                  }
                }); /* foreach */
              } // else
            }  // else
       });
   }
}


// REST API의 URI와 핸들러를 매핑합니다.
//  URI: http://xxxx/users/auth
router.get('/auth', PrintLoginForm);   // 로그인 입력화면을 출력
router.post('/auth', HandleLogin);     // 로그인 정보로 인증처리

// ------------------------------  로그아웃기능 --------------------------------------

const HandleLogout = (req, res) => {
       req.session.destroy();     // 세션을 제거하여 인증오작동 문제를 해결
       res.redirect('/');         // 로그아웃후 메인화면으로 재접속
}

// REST API의 URI와 핸들러를 매핑합니다.
router.get('/logout', HandleLogout);       // 로그아웃 기능


// ------------------------------- 정보변경 기능을 개발합니다 ------------------------------
const PrintProfile = (req, res) => {
   let htmlstream = '';

   htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar2.ejs','utf8');
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/profile_update.ejs','utf8');
   htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

   res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                     'logurl': '/users/logout',
                                     'loglabel': '로그아웃',
                                     'regurl': '/users/profile',
                                     'reglabel': req.session.who,
                                     'uid': req.session.uid,
                                      'pass': req.session.pass,
                                     'name': req.session.name,
                                     'phone':req.session.phone,
                                     'address': req.session.address,
                                     'birth': req.session.birth,
                                     'point': req.session.point}));
}

router.get('/profile', PrintProfile);     // 정보변경화면을 출력


// 회원정보를 수정하여 DB에 저장합니다.
const HandleUpdateProfile = (req, res) => {  // 회원 정보 수정
let body = req.body;
let htmlstream = '';

    // 임시로 확인하기 위해 콘솔에 출력해봅니다.
    console.log("---- 회원수정 실행 ----")
    console.log("수정 후 회원 비밀번호 : " + body.pw1);
    console.log("수정 후 회원 연락처 : " + body.uphone);
    console.log("수정 후 회원 주소 : " + body.uaddress);
    console.log("수정 후 회원 생년월일 : " + body.ubirth);

    if (body.pw1 == '') {
        console.log("비밀번호는 필수로 입력해주세요.");
        res.status(561).end('<meta charset="utf-8">비밀번호는 필수로 입력해주세요.');
    }
    else {
       db.query('UPDATE u18_users SET pass = ?, phone = ?, address = ?, birth = ? where uid=?',
       [body.pw1, body.uphone, body.uaddress, body.ubirth, body.uid], (error, results, fields) => {
          if (error) {
            htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                               'warn_title':'회원수정 오류',
                               'warn_message':'회원 정보를 다시 수정해주세요.',
                               'return_url':'/' }));
          } else {
           console.log("---- 회원수정 완료! 다시 로그인을 하시면 수정된 사항이 적용됩니다. ----");
           res.redirect('/');
          }
       });

    }
};

// REST API의 URI와 핸들러를 매핑합니다.
router.post('/update_profile', HandleUpdateProfile);


// --------------------------------------------- 상품 검색 기능 ----------------------------------------
// 상품검색을 수행합니다.
const HandleSearch = (req, res) => {
  let    body = req.body.search;
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str = '';

       if (req.session.auth)   {   // 로그인된 경우에만 처리한다
           console.log("검색된 상품 : " + body);
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/navbar2.ejs','utf8');  // 사용자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/searched_products.ejs','utf8'); // 검색된 상품 결과
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT maker, pname, modelnum, rdate, price, pic from u18_products where pname like '%" + body + "%';"; // 상품조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 검색에 일치하는 상품조회 SQL실행
               if (error) { res.status(562).end("HandleSearch: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                      'warn_title':'상품조회 오류',
                                      'warn_message':'조회된 상품이 없습니다.',
                                      'return_url':'/' }));
                   }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                       'logurl': '/users/logout',
                                                       'loglabel': '로그아웃',
                                                       'regurl': '/users/profile',
                                                       'reglabel': req.session.who,
                                                        prodata : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'로그인 필요',
                            'warn_message':'상품검색을 하려면, 로그인이 필요합니다.',
                            'return_url':'/' }));
       }
};

// REST API의 URI와 핸들러를 매핑합니다.
router.post('/search', HandleSearch);

module.exports = router;
