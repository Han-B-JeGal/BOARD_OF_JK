// Node.JS 내외부 모듈추출
const    cookieParser = require('cookie-parser');
const    session = require('express-session');
const    bodyParser = require('body-parser');
const    express = require('express');
const    app = express();
const    createError = require('http-errors');
const    path = require('path');

// 개발소스 모듈
const    mainui = require('./routes/mainui');
const    users = require('./routes/users');
const    adminprod = require('./routes/adminprod');
const    product = require('./routes/product');

// 전용 PORT주소 설정
const    PORT = '52272';

// 실행환경 설정단
app.set('views', path.join(__dirname, 'views'));  // views경로 설정(ejs파일이 있는곳을 'view'로 가리킴)
app.set('view engine', 'ejs');                    // view엔진 지정
app.use(express.static(path.join(__dirname, 'public')));   // public설정
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ key: 'sid',
                  secret: 'secret key',  // 세션id 암호화할때 사용
                  resave: false,         // 접속할때마다 id부여금지
                  saveUninitialized: true })); // 세션id사용전에는 발급금지

// URI와 핸들러를 매핑
app.use('/', mainui);       // URI (/) 접속하면 mainui로 라우팅
app.use('/users', users);   // URI('/users') 접속하면 users로 라우팅
app.use('/adminprod', adminprod); // URI('/adminprod') 접속하면 adminprod로 라우팅
app.use('/product', product); // URI('/product') 접속하면 product로 라우팅
// app.use('/log', login);
// app.use('/log', login);
// app.use('/log', login);


// 서버 실행
app.listen(PORT, function () {
       console.log('Server running at : http://127.0.0.1:' + PORT);
});
