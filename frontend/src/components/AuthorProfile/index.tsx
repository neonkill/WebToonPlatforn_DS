import React,{useState, useEffect} from 'react'
import './index.css'
import {IAuthorProfileProps} from '../../data/interface/IAuthorProfileProps'
import { Button, Descriptions, Statistic, Card, Row, Col } from 'antd';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import banana from './img/banana.webp'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import axios from 'axios'
const AuthorProfile : React.FC<IAuthorProfileProps> = (props : IAuthorProfileProps) => {
    const [tokenCount, setTokenCount] = useState()
    const isCancelled = React.useRef(false);
    const [publicKey, setPublicKey] = useState()
    const [privateKey, setPrivateKey] = useState()
    const [flag, setFlag] = useState<boolean>(false)
    useEffect(()=>{
        retriveToken()
    },[privateKey])
    useEffect(()=>{
        onAuthHandler().then((res) =>{
            setPublicKey(res.publicKey)
            setPrivateKey(res.privateKey)
        })
        return () => {
            isCancelled.current = true;
          };
    },[])
    const onAuthHandler = async () => {
        return await axios("/api/users/auth").then(res=> {return res.data})
    }
    const retriveToken = async () => {
        console.log(publicKey, privateKey)
        const res = await axios.post('/api/token/token_amount',  {user : {public_key : publicKey , private_key : privateKey}}  )
        if(res.data.balance == undefined || res.data.balance == null) return;
        const data = await res.data
        console.log(res)
        if(!isCancelled.current){
            console.log(data.balance)
            setTokenCount(data.balance)
        }
    }
    return (
        <div className="author-profile-container">
            <div className="author-profile-image-cotainer">
                <h2 className="author-profile-title">프로필 설정</h2>
                <img className="author-profile-image" src={banana} alt="author-profile"/>
                <div className="author-profile-meta">
                    <Button className="author-btn author-btn-setting"><EditOutlined/></Button>
                    <Button className="author-btn author-btn-setting"><EllipsisOutlined/></Button>
                    <Button className="author-btn author-btn-setting"><SettingOutlined/></Button>
                </div>
            </div>
            <div className="author-desc-container">
                <h2 className="author-profile-title">information</h2>
                <Descriptions
                    bordered
                    column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 2, xs: 1 }}
                >
                    <Descriptions.Item label="이름">{props.name}</Descriptions.Item>
                    <Descriptions.Item label="연재 작품 수">1</Descriptions.Item>
                    <Descriptions.Item label="마감 일자">수요일 23:59분</Descriptions.Item>
                    <Descriptions.Item label="소속">블루어웨이</Descriptions.Item>
                    <Descriptions.Item label="좋아요">400+</Descriptions.Item>
                    <Descriptions.Item label="이메일">{props.email}</Descriptions.Item>
                    <Descriptions.Item label="작가 소개">
                    안녕하세요!
                    <br />
                    재밌는 바나나툰을 함계 즐겨주실 바랍니다.
                    <br />
                    보다 재밌고, 보다 정신 나갈 것같은(?) 만화를 선보이겠습니다.
                    감사합니다~
                    </Descriptions.Item>
                </Descriptions>
                {`public-key : ${publicKey}`}
            </div>
            <div className="author-profile-statics">
                <h2 className="author-profile-title">통계</h2>
                <Row gutter={16}>
                    <Col span={12}>
                        <Card>
                        <Statistic
                            title="토큰 개수"
                            value={tokenCount}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<ArrowUpOutlined />}
                            suffix="개"
                            key={0}
                        />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card>
                        <Statistic
                            title="좋아요"
                            value={9}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<ArrowDownOutlined />}
                            suffix=""
                        />
                        </Card>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Card>
                        <Statistic
                            title="팬"
                            value={210}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<ArrowUpOutlined />}
                            suffix=""
                        />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card>
                        <Statistic
                            title="덧글 수"
                            value={18}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<ArrowDownOutlined />}
                            suffix="개"
                        />
                        </Card>
                    </Col>
                </Row>
            </div>

        </div>
    )
}

export default AuthorProfile