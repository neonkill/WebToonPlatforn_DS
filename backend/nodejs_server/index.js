const express = require('express')
const app = express()
const port = 8080
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const { User } = require('./models/User')
const config = require('./config/key')
const cookieParser = require('cookie-parser')
const { auth } = require('./middleware/auth')
const token_functions = require('./Token_function')
// 아래처럼 bodyParser 옵션을 설정해주면 자동으로 들어오는 데이터를 parsing해준다. 가령 json으로 파싱
//application/x-www-from-urlencoded 로 오는 데이터가 오는 것을 분석해서 가져올 수 있게 한다.
app.use(bodyParser.urlencoded({extended: true}))
//application/json 으로 오는 것을 얻기위함이다. 
app.use(bodyParser.json())
//이렇게 설정해주어야 쿠키파서를 사용가능
app.use(cookieParser())
//connect에 key를 넣는다. 이 경우에 key를 숨겨야 하므로 dev mode와 prod mode에 따라 key를 따로 관리하자
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log("mongo db connected")).catch( err => console.log(err))

app.get('/', (req,res) => {
    res.send("hello")
})

app.get('/api/hello', (req,res) => {
    console.log("start")
    res.send("hello my friends")
})

app.post('/api/users/register', (req, res) => {
    //mongodb user model, model은 데이터 ORM이다.
    const user = new User(req.body)
    //model을 통해 데이터를 저장한다.
    user.save((err, userInfo) => {
        if(err) return res.json({ success : false, err})
        return res.status(200).json({
            success: true
        })
    })
})

app.post('/api/users/login',(req, res) => {
    //요청한 이메일을 데이터 베이스에서 있는지 찾는다.
    User.findOne({email : req.body.email } , (err ,user) => {
        if(!user){
            return res.json({
                loginSuccess : false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            })
        }
        // 요청한 이메일이 데이터 베이스에 있다면 비밀번호 확인
        // 해당 메서드는 유저 스키마에서 우리가 만들면 된다.
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({loginSuccess : false, message : "비밀번호가 틀렸습니다."})
            // 비밀번호까지 맞다면 그 유저를 위한 토큰 생성 -> jswonwebtoken 라이브러리가 필요하다.
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);
                // 토큰을 저장한다. -> 쿠키에 저장하자, 쿠키 파서 설치
                res.cookie("x_auth", user.token)
                .status(200)
                .json({
                    loginSuccess: true,
                    userId: user._id
                })
            })
        })
    })
})
// 인증 처리 api
// 어떤 페이지는 로그인한 유저만 들어갈 수 있다. 이것을 알기위해서는 jwt 토큰을 이용하는 것이다.
// 쿠키에 jwt를 넣어좠고 db에 jwt가 있다. 따라서, 쿠키의 jwt 토큰을 가져와서 db의 유저의 jwt와 비교하는 것이다.
// 왜 db의 jwt까지 비교해야한다면, 혹시 로그인이 안되었는데도 jwt토큰을 가지고 있어서 접근 불가능 웹페이지에 접근할 수도 있기 때문이다.
// auth는 middleware로 인증처리 로직이 담겨져 있다.
app.get('/api/users/auth', auth , (req, res) => {
    // 여기 까지 미들웨어를 통과해 왔다는 것은 auth가 true라는 것이다. 그래서 req에 user와 token 정보를 전달된다.
    res.status(200).json({
        _id: req.user._id,
        userRole: req.user.role,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        image: req.user.image,
        publicKey :req.user.publicKey,
        privateKey : req.user.privateKey 
    })
})

app.get('/api/users/logout', auth, (req,res) => {
    User.findOneAndUpdate({_id:req.user._id}, {token: ""}, (err,user)=>{
        if(err) return res.json({success:false})
        return res.status(200).send({
            success: true
        })
    })
})


// 현재 보유량
//api/token/token_amount
//api/token/token_buy
//api/token/webtoon_buy
//api/admin/mint

/*
input :
{
    user:{
        public_key: "공개키",
        private_key: "개인키"
    }
}
output :
{
    success: true,
    balance: 호출자 잔고
}

{
    success: false
}
*/

// 토큰 잔고를 알려줌
app.post('/api/token/token_amount', async (req,res)=>{
    //token_functions
    const res_token = await token_functions.balanceOf(req.body.user.public_key, req.body.user.private_key)//req.user.public_key,req.user.private_key
    if(!res_token.success) return res.json({success:false})
    return res.status(200).json({
        success: true,
        balance: res_token.balance
    })

})


/*dsdsdsds
{dsdsdsdsrsds
    user:{
        public_key: "공개키",
        private_key: "개인키",
        amount: "토큰구매량"
    }
}
output :
{
    success: true,
    balance: 토큰구매자 잔고
}

{
    success: false
}
*/
// 토큰 구매 후 성공하면 잔고를 알려줌
app.post('/api/token/token_buy', async (req,res)=>{
    const res_token = await token_functions.buy_token(req.body.user.public_key,req.body.user.private_key,req.body.user.amount)//req.user.public_key,req.user.private_key,req.amount
    if(!res_token.success)return res.json({success:false})
    return res.status(200).json({
        success: true,
        balance: res_token.balance,
        receipt : res_token.receipt
    })
})

/*
input :
{
    user:{
        public_key: "공개키",
        private_key: "개인키",
        title: "웹툰제목",
        amount: "토큰구매량"
    }
}
output :
{
    success: true,
    balance: 웹툰구매자 잔고
}

{
    success: false
}
*/
// 웹툰 구매 후 성공하면 잔고를 알려줌
app.post('/api/token/webtoon_buy', async (req,res)=>{
    const res_token = await token_functions.buy_webtoon(req.body.user.public_key, req.body.user.private_key, req.body.user.title, req.body.user.amount)
    if(!res_token.success) return res.json({success:false})
    return res.status(200).json({
        success: true,
        balance: res_token.balance,
        receipt : res_token.receipt
    })
})

/*
input :
{
    user:{
        title: "웹툰제목"
    }
}
output :
{
    success: true,
    address: 웹툰작품 작가의 공개키 주소
}

{
    success: false
}
*/
// For 준범님
// 워터마크를 위한 작가 공개키 주소가 나옴
app.get('/api/token/author_address', async (req,res)=>{
    const res_token = await token_functions.get_address(req.body.user.title)
    if(!res_token.success) return res.json({success:false})
    return res.status(200).json({
        success: true,
        address: res_token.address
    })
})

/*
input :
{
    user:{
        public_key: "공개키",
        private_key: "개인키",
        title: "웹툰제목"
    }
}
output :
{
    success: true,
    regist: bool(등록 성공여부. 현재는 무조건 등록되도록 돼있음)
}

{
    success: false
}
*/
// 작품 명으로 작가 공개키 주소를 등록
app.post('/api/token/regist_address', async (req,res)=>{
    const res_token = await token_functions.regist_address(req.body.user.public_key, req.body.user.private_key, req.body.user.title)
    if(!res_token.success) return res.json({success:false})
    return res.status(200).json({
        success: true,
        regist: res_token.regist
    })
})


app.listen(port , () => console.log(`server started ${port}`))
