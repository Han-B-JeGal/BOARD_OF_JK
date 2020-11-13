const fs          = require('fs');
const express     = require('express');
const ejs         = require('ejs');
const mysql       = require('mysql');
const bodyParser  = require('body-parser');
const session     = require('express-session');
const multer      = require('multer');
const upload      = multer({dest: __dirname + '/../public/images/uploads/products'});  // 업로드 디렉터리를 설정한다.
const router      = express.Router();

const   db = mysql.createConnection({
  host: '',        // DB서버 IP주소
  port: '',               // DB서버 Port주소
  user: '',         // DB접속 아이디
  password: '',    // DB암호
  database: ''        //사용할 DB명
});

//  -----------------------------------  상품리스트 기능 -----------------------------------------
// (관리자용) 등록된 상품리스트를 브라우져로 출력합니다.
const AdminPrintProd = (req, res) => {
  let htmlstream   = '';
  let htmlstream2  = '';
  let sql_str      = '';

       if (req.session.auth && req.session.admin)   {   // 관리자로 로그인된 경우에만 처리한다
           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminproduct.ejs','utf8'); // 괸리자메인화면
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT itemid, category, maker, pname, modelnum, rdate, price, amount from u18_products order by rdate desc;"; // 상품조회SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 상품조회 SQL실행

               if (error) { res.status(562).end("AdminPrintProd: DB query is failed"); }
               else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title'        : '알리미',
                                                                 'warn_title'   :'상품조회 오류',
                                                                 'warn_message' :'조회된 상품이 없습니다.',
                                                                 'return_url'   :'/' }));
              }
              else {  // 조회된 상품이 있다면, 상품리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title'    : '쇼핑몰site',
                                                       'logurl'   : '/users/logout',
                                                       'loglabel' : '로그아웃',
                                                       'regurl'   : '/users/profile',
                                                       'reglabel' : req.session.who,
                                                        prodata   : results }));  // 조회된 상품정보
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');

         res.status(562).end(ejs.render(htmlstream, { 'title'         : '알리미',
                                                      'warn_title'    :'상품등록기능 오류',
                                                      'warn_message'  :'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                                                      'return_url'    :'/' }));
       }

};

//  -----------------------------------  상품등록기능 -----------------------------------------
// 상품등록 입력양식을 브라우져로 출력합니다.
const PrintAddProductForm = (req, res) => {
   let htmlstream = '';

   if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
     htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/product_form.ejs','utf8'); // 괸리자메인화면
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

     res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});
     res.end(ejs.render(htmlstream,  { 'title'    : '쇼핑몰site',
                                       'logurl'   : '/users/logout',
                                       'loglabel' : '로그아웃',
                                       'regurl'   : '/users/profile',
                                       'reglabel' : req.session.who }));
   }
   else {
     htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
     res.status(562).end(ejs.render(htmlstream, { 'title'         : '알리미',
                                                  'warn_title'    :'상품등록기능 오류',
                                                  'warn_message'  :'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                                                  'return_url'    :'/' }));
   }

};

// 상품등록 양식에서 입력된 상품정보를 신규로 등록(DB에 저장)합니다.
const HandleAddProduct = (req, res) => {  // 상품등록
  let    body = req.body;
  let    htmlstream = '';
  let    datestr, y, m, d, regdate;
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;
  let    result = { originalName  : picfile.originalname,
                   size : picfile.size     }

       console.log(body);     // 이병문 - 개발과정 확인용(추후삭제).

       if (req.session.auth && req.session.admin) {
           if (body.itemid == '' || datestr == '') {
             console.log("상품번호가 입력되지 않아 DB에 저장할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">상품번호가 입력되지 않아 등록할 수 없습니다');
          }
          else {

              prodimage = prodimage + picfile.filename;
              regdate = new Date();
              db.query('INSERT INTO u18_products (itemid, category, maker, pname, modelnum, rdate, price, dcrate, amount, event, pic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [body.itemid, body.category, body.maker, body.pname, body.modelnum, regdate,
                     body.price, body.dcrate, body.amount, body.event, prodimage], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                                'warn_title':'상품등록 오류',
                                                                'warn_message':'상품으로 등록할때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                                                'return_url':'/' }));
                } else {
                   console.log("상품등록에 성공하였으며, DB에 신규상품으로 등록하였습니다!");
                   res.redirect('/adminprod/list');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                                      'warn_title':'상품등록기능 오류',
                                                      'warn_message':'관리자로 로그인되어 있지 않아서, 상품등록 기능을 사용할 수 없습니다.',
                                                      'return_url':'/' }));
       }
};


//  -----------------------------------  회원리스트 조회 기능 -----------------------------------------
// (관리자용) 등록된  회원리스트를 브라우져로 출력합니다.
const PrintUserList = (req, res) => {
  let    htmlstream = '';
  let    htmlstream2 = '';
  let    sql_str;
  // const  query = url.parse(req.url, true).query;

       //console.log(query.category);

       if (req.session.auth && req.session.admin)   {   // 로그인된 경우에만 처리한다

           htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/user_list.ejs','utf8'); // 회원리스트
           htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer
           sql_str = "SELECT uid, name, address, phone, point from u18_users;"; // 회원리스트 조회 SQL

           res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

           db.query(sql_str, (error, results, fields) => {  // 회원리스트 조회 SQL실행
               if (error) { res.status(562).end("회원리스트 조회중 에러 발생!"); }
               else if (results.length <= 0) {  // 조회된 회원이 없다면, 오류메시지 출력
                   htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream2, { 'title'        : '알리미',
                                                                 'warn_title'   :'회원리스트 조회 오류',
                                                                 'warn_message' :'조회된 회원이 없습니다.',
                                                                 'return_url'   :'/' }));
                   }
              else {  // 조회된 회원이 있다면, 회원리스트를 출력
                     res.end(ejs.render(htmlstream,  { 'title'    : '쇼핑몰site',
                                                       'logurl'   : '/users/logout',
                                                       'loglabel' : '로그아웃',
                                                       'regurl'   : '/users/profile',
                                                       'reglabel' : req.session.who,
                                                        userlist  : results }));  // 조회된 회원리스트
                 } // else
           }); // db.query()
       }
       else  {  // (관리자로 로그인하지 않고) 본 페이지를 참조하면 오류를 출력
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title'       : '알리미',
                                                      'warn_title'  :'회원리스트 기능 오류',
                                                      'warn_message':'관리자로 로그인되어 있지 않아서, 회원리스트를 열람할 수 없습니다..',
                                                      'return_url'  :'/' }));
       }
};


// --------------- 관리자 모드에서 정보변경 기능을 개발합니다 --------------------
const PrintProfileForm = (req, res) => {
   let body = req.body;
   let htmlstream = '';
   let htmlstream2 = '';
   let sql_str = '';

   if (req.session.auth)   {   // 로그인된 경우에만 처리한다
     htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/profile_update_by_admin.ejs','utf8');
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

     sql_str = "SELECT * from u18_users where uid='" + body.uid + "';";

     res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

     db.query(sql_str, (error, results, fields) => {  // 검색에 일치하는 상품조회 SQL실행
         if (error) { res.status(562).end("유저정보수정by관리자: DB query is failed"); }
         else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
             htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
             res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                           'warn_title':'상품조회 오류',
                                                           'warn_message':'조회된 상품이 없습니다.',
                                                           'return_url':'/' }));
             }
        else {  // 조회된 상품이 있다면, 상품리스트를 출력
               res.end(ejs.render(htmlstream,  { 'title'    : '쇼핑몰site',
                                                 'logurl'   : '/users/logout',
                                                 'loglabel' : '로그아웃',
                                                 'regurl'   : '/users/profile',
                                                 'reglabel' : req.session.who,
                                                  userdata  : results }));  // 조회된 상품정보
           } // else
     }); // db.query()
   }
 }



// 관리자 모드에서 회원정보를 수정하여 DB에 저장합니다.
const HandleUpdateProfile = (req, res) => {  // 회원 정보 수정
let body = req.body;
let htmlstream = '';

    // 임시로 확인하기 위해 콘솔에 출력해봅니다.
    console.log("---- 회원수정 실행 ----")
    console.log(body.uid); console.log(body.pw1); console.log(body.uphone); console.log(body.uaddress); console.log(body.ubirth); console.log(body.uPoint);

    if (body.pw1 == '') {
        console.log("비밀번호는 필수로 입력해주세요.");
        res.status(561).end('<meta charset="utf-8">비밀번호는 필수로 입력해주세요.');
    }
    else {
       db.query('UPDATE u18_users SET pass=?, phone=?, address=?, birth=?, point=? where uid=?',
       [body.pw1, body.uphone, body.uaddress, body.ubirth, body.upoint , body.uid], (error, results, fields) => {
          if (error) {
            htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            res.status(562).end(ejs.render(htmlstream, { 'title'        : '알리미',
                                                         'warn_title'   :'회원수정 오류',
                                                         'warn_message' :'회원 정보를 다시 수정해주세요.',
                                                         'return_url'   :'/' }));
          } else {
           console.log("---- 회원수정 완료 ----");
           res.redirect('/adminprod/userlist');

          }
       });

    }
};

//-------------------------- 회원 삭제 기능 --------------------------------
// 관리자 모드에서 해당하는 회원정보를 삭제합니다.
const DeleteProfile = (req, res) => {  // 회원 정보 수정
let body = req.body;
let htmlstream = '';
let sql_str = '';

    // 임시로 확인하기 위해 콘솔에 출력해봅니다.
    console.log("---- 회원삭제 실행 ----")
    sql_str = "DELETE FROM u18_users where uid='" + body.uid + "';"
     db.query(sql_str, (error, results, fields) => {
        if (error) {
          htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
          res.status(562).end(ejs.render(htmlstream, { 'title'        : '알리미',
                                                       'warn_title'   :'회원삭제 오류',
                                                       'warn_message' :'회원을 다시 삭제해주세요.',
                                                       'return_url'   :'/' }));
        } else {
         console.log("---- 회원삭제 완료 ----");
         res.redirect('/adminprod/userlist');

        }
     });

};


//-------------------------- 상품 수정 기능 --------------------------------
// 상품수정 입력양식을 브라우져로 출력합니다.
const PrintUpdateProductForm = (req, res) => {
   let body = req.body;
   let htmlstream = '';
   let sql_str = '';

   if (req.session.auth && req.session.admin) { // 관리자로 로그인된 경우에만 처리한다
     htmlstream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    // 헤더부분
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/adminbar.ejs','utf8');  // 관리자메뉴
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/update_products.ejs','utf8'); // 괸리자메인화면
     htmlstream = htmlstream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  // Footer

     sql_str = "SELECT * from u18_products where itemid='" + body.itemid + "';";

     res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

     db.query(sql_str, (error, results, fields) => {  // 검색에 일치하는 상품조회 SQL실행
         if (error) { res.status(562).end("상품수정 오류 by 관리자: DB query is failed"); }
         else if (results.length <= 0) {  // 조회된 상품이 없다면, 오류메시지 출력
             htmlstream2 = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
             res.status(562).end(ejs.render(htmlstream2, { 'title': '알리미',
                                                           'warn_title':'상품수정 오류',
                                                           'warn_message':'조회된 상품이 없습니다.',
                                                           'return_url':'/' }));
             }
        else {  // 조회된 상품이 있다면, 상품리스트를 출력
               res.end(ejs.render(htmlstream,  { 'title' : '쇼핑몰site',
                                                 'logurl': '/users/logout',
                                                 'loglabel': '로그아웃',
                                                 'regurl': '/users/profile',
                                                 'reglabel': req.session.who,
                                                  prodata: results }));  // 조회된 상품정보
           } // else
     }); // db.query()
   };
};

// 상품수정후 양식에서 입력된 상품정보를 수정하여 등록(DB에 저장)합니다.
const HandleUpdateProduct = (req, res) => {  // 상품등록
  let    body = req.body;
  console.log(body);
  console.log(body.itemid);
  let    htmlstream = '';
  let    datestr, y, m, d, regdate;
  let    prodimage = '/images/uploads/products/'; // 상품이미지 저장디렉터리
  let    picfile = req.file;
  let    result = { originalName  : picfile.originalname,
                   size : picfile.size     }

       if (req.session.auth && req.session.admin) {
           if (body.itemid == '' || datestr == '') {
             console.log("상품번호가 입력되지 않아 DB에 저장할 수 없습니다.");
             res.status(561).end('<meta charset="utf-8">상품번호가 입력되지 않아 등록할 수 없습니다');
          }
          else {
              prodimage = prodimage + picfile.filename;
              regdate = new Date();
              db.query('UPDATE u18_products SET itemid=?, category=?, maker=?, pname=?, modelnum=?, rdate=?, price=?, dcrate=?, amount=?, event=?, pic=? where itemid=?;',
                    [body.itemid, body.category, body.maker, body.pname, body.modelnum, regdate,
                     body.price, body.dcrate, body.amount, body.event, prodimage, body.itemid], (error, results, fields) => {
               if (error) {
                   htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                   res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                                 'warn_title':'상품수정 오류',
                                 'warn_message':'상품을 수정할 때 DB저장 오류가 발생하였습니다. 원인을 파악하여 재시도 바랍니다',
                                 'return_url':'/' }));
                } else {
                   console.log("상품등록에 성공하였으며, DB에 상품이 수정되었습니다!");
                   res.redirect('/adminprod/list');
                }
           });
       }
      }
     else {
         htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
         res.status(562).end(ejs.render(htmlstream, { 'title': '알리미',
                            'warn_title':'상품수정기능 오류',
                            'warn_message':'관리자로 로그인되어 있지 않아서, 상품수정 기능을 사용할 수 없습니다.',
                            'return_url':'/' }));
       }
};


// ------------------------ 상품 삭제 기능 ----------------------------
const DeleteProduct = (req, res) => {
let body = req.body;
let htmlstream = '';
let sql_str = '';

    // 임시로 확인하기 위해 콘솔에 출력해봅니다.
    console.log("---- 상품삭제 실행 ----")
    sql_str = "DELETE FROM u18_products where itemid='" + body.itemid + "';"
     db.query(sql_str, (error, results, fields) => {
        if (error) {
          htmlstream = fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
          res.status(562).end(ejs.render(htmlstream, { 'title'        : '알리미',
                                                       'warn_title'   :'상품삭제 오류',
                                                       'warn_message' :'상품을 다시 삭제해주세요.',
                                                       'return_url'   :'/' }));
        } else {
         console.log("---- 상품삭제 완료 ----");
         res.redirect('/adminprod/list');

        }
     });

};


// REST API의 URI와 핸들러를 매핑합니다.
router.get('/form', PrintAddProductForm);                                         // 상품등록화면을 출력처리
router.post('/product', upload.single('photo'), HandleAddProduct);                // 상품등록내용을 DB에 저장처리
router.get('/list', AdminPrintProd);                                              // 상품리스트를 화면에 출력
router.get('/userlist', PrintUserList);                                           // 회원리스트를 화면에 출력
router.post('/profile_update', PrintProfileForm);                                 // 관리자 모드에서 회원정보 변경화면을 출력
router.post('/update_profile', HandleUpdateProfile);                              // 관리자 모드에서 회원정보 변경하여 DB에 저장처리
router.post('/delete_profile', DeleteProfile);                                    // 관리자 모드에서 회원정보를 삭제
router.post('/update_products', PrintUpdateProductForm);                          // 상품수정폼을 화면에 출력
router.post('/update_product', upload.single('photo'), HandleUpdateProduct);      // 상품수정 정보를 변경하여 DB에 저장처리
router.post('/delete_product', DeleteProduct);                                    // 상품삭제 DB 코드
// router.get('/', function(req, res) { res.send('respond with a resource 111'); });

module.exports = router;
