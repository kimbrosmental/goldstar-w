// Shared application logic: encrypted user DB, auth, i18n, nav, messaging
(async()=>{
  const DB_STORAGE_KEY = 'member_db_secure_v1';
  const CURRENT_KEY = 'current_user_email_v1';
  const PASSPHRASE = 'goldstar-demo-secret-passphrase-CHANGE_ME'; // TODO: change for production
  const encoder = new TextEncoder();

  const i18n = {
    ko:{
  /* Nav */ nav_home:'홈',nav_intro:'소개',nav_progress:'진행',nav_video:'영상',nav_history:'이력',nav_contact:'문의',nav_signup:'회원가입',nav_login:'로그인',nav_profile:'내 정보',nav_admin:'관리',nav_messages:'쪽지',
      /* Index Sections */ price_today:'오늘의 금 시세 (3.75g)',supply_price:'공급 가격 (3.75g)',section2_title:'검은 대륙의 금맥',section3_title:'유통 구조의 혁신',section4_title:'실제 공급 성과',section5_title:'지금 바로 문의하세요',section5_text:'골드스타와 함께 새로운 투자의 기회를 시작하세요',footer_company:'회사 정보',footer_contact:'연락처',footer_support:'고객지원',
  site_title:'회사 홈페이지',
  hook_line1:'“금은 결국 오른다.”',hook_line2:'“다만, 합리적 금액에 살 수 있는 순간은 짧다.”',hook_line3:'지금이 바로 그 순간입니다,',hook_line4:'준비되셨나요?',
  note_prev_change:'[전일 기준 시세변동폭]',note_compare_now:'[현 시세 기준과 비교]',
  video1_desc:'상단 영상 설명을 여기에 입력하세요.',video2_desc:'하단 영상 설명을 여기에 입력하세요.',video_not_supported:'브라우저가 동영상을 지원하지 않습니다.',
  alt_logo:'골드스타 로고',alt_goldbar:'골드바 이미지',alt_kakao:'카카오톡 문의',alt_telegram:'텔레그램 문의',
  footer_company_name:'상호명: 골드스타',footer_ceo:'대표이사: 홍길동',footer_biz:'사업자등록번호: 123-45-67890',footer_mailorder:'통신판매업: 제2025-서울강남-0000호',footer_addr:'주소: 서울특별시 강남구 테헤란로 123',footer_tel:'대표전화: 02-1234-5678',footer_email:'이메일: info@goldstar.com',footer_fax:'팩스: 02-1234-5679',footer_hours:'운영시간: 평일 09:00 - 18:00',footer_lunch:'점심시간: 12:00 - 13:00',footer_off:'토/일/공휴일 휴무',
  section2_stat_1_title:'3억2천만톤',section2_stat_1_desc:'2023년 우간다 금 매장량 발견',
  section2_stat_2_title:'글로벌 주목',section2_stat_2_desc:'12조원 가치평가, CNN, BBC 등 해외 언론 집중 보도',
  section2_stat_3_title:'독점 계약',section2_stat_3_desc:'우간다 금맥, 중국 광산업체들과 채굴 독점 계약 체결 → 골드 스타, 중국 업체와 수입계약 체결',
  section4_title:'실제 공급 성과',section4_desc_total:'총 공급 완료량',section4_desc_discount:'시세 대비 평균 할인율',section4_desc_members:'누적 참여 회원',
  aria_menu_open:'메뉴 열기',
  aria_lang_select:'언어 선택',
  label_admin_tag:'[관리자]',
  messages_delete_confirm:'이 쪽지를 삭제할까요?',
  aria_lang_select:'언어 선택',
  carousel_desc_1:'금 매장지 확인, 기초 전경',carousel_desc_2:'지하 매장지 채굴 현장 전경',carousel_desc_3:'우간다 금 매장지 현장 전경',carousel_desc_4:'금 매장지, 현지 작업자 선별 채굴 전경 1',carousel_desc_5:'금 매장지, 현지 작업자 선별 채굴 전경 2',carousel_desc_6:'현지 작업자들의 금 입자 수작업 분류',carousel_desc_7:'세척 후 금 입자 선별 장면',carousel_desc_8:'세척 후 금 입자 2차 선별 장면',carousel_desc_9:'주조용 용광로 온도 점검 및 선별 투입',carousel_desc_10:'금 함량 초기 검사',carousel_desc_11:'1차 가공 완료',carousel_desc_12:'금매장지 보안 경찰',carousel_desc_13:'채굴 계약 현장 전경',
      /* Signup */ page_signup_title:'회원가입',label_username:'아이디',btn_check_duplicate:'중복검사',dup_available:'사용 가능한 아이디입니다.',dup_unavailable:'이미 사용중인 아이디입니다.',dup_invalid_format:'형식 오류 (영문/숫자/_) 3~20자',dup_enter_username:'아이디를 입력하세요.',dup_need_check:'중복검사를 실행하세요.',label_name:'이름',label_birth:'생년월일 (YYYY-MM-DD)',label_phone:'연락처',label_email:'이메일',label_password:'비밀번호',label_password_confirm:'비밀번호 확인',label_bank:'은행',label_account:'계좌번호',btn_signup_submit:'가입하기',err_required_all:'모든 항목을 입력해주세요.',err_need_dup_check:'아이디 중복검사를 해주세요.',err_password_mismatch:'비밀번호가 일치하지 않습니다.',err_email_format:'이메일 형식에 맞게 입력해 주세요.',signup_success_redirect:'가입 완료! 잠시 후 내 정보 페이지로 이동합니다.',placeholder_username:'영문/숫자/밑줄 3~20자',placeholder_account:'하이픈 없이 숫자',
      /* Login */ page_login_title:'로그인',label_login_id:'아이디',btn_login_submit:'로그인',login_success:'로그인 성공',login_failed:'로그인 실패',
  /* Profile */ page_profile_title:'내 정보',section_member_info:'회원 기본 정보',section_orders:'주문 내역',section_messages:'1:1 문의',btn_send:'보내기',note_admin_only_reply:'관리자만 답변을 남길 수 있습니다.',orders_empty:'없음',messages_empty:'문의가 없습니다.',btn_logout:'로그아웃',btn_mock_order_add:'모의 주문 추가',field_username:'아이디',field_name:'이름',field_birth:'생년월일',field_phone:'연락처',field_email:'이메일',field_bank:'은행',field_account:'계좌번호',field_joined:'가입일',field_role:'권한',status_unread:'미읽음',status_read:'읽음',status_answered:'답변 완료',btn_mark_read:'읽음 처리',btn_reply:'답변',btn_order_add:'주문 추가',btn_change_password:'비밀번호 변경',pw_change_success:'비밀번호가 변경되었습니다.',pw_change_fail:'비밀번호 변경 실패',
  /* Admin */ page_admin_title:'관리자 페이지',section_users:'회원 목록',section_add_user:'신규 회원 추가',btn_add_user:'추가',msg_required_fields:'필수 항목',section_orders_admin:'주문 관리',orders_empty_admin:'주문 없음',section_messages_admin:'1:1 문의',messages_empty_admin:'쪽지 없음',section_admin_reply:'관리자 답변',label_reply_email:'회원 이메일',label_reply_content:'답변 내용',btn_send_reply:'답변 보내기',msg_add_success:'추가 완료',msg_reply_success:'전송 완료',action_delete:'삭제',btn_edit:'수정',btn_save:'저장',btn_cancel:'취소',btn_reset_pw:'PW 변경',btn_add_order_admin:'주문 추가',btn_edit_order:'수정',msg_update_success:'수정 완료',msg_update_fail:'수정 실패',msg_pw_reset_success:'비밀번호 변경 완료',msg_pw_reset_fail:'비밀번호 변경 실패',
  section_admin_info:'관리자 정보',btn_refresh:'새로고침',
  /* Messages */ page_messages_title:'쪽지 / 1:1 문의',placeholder_message:'문의 내용을 입력하세요',label_admin_tag:'[관리자]',messages_delete_confirm:'삭제하시겠습니까?',
  /* General */ btn_delete:'삭제'
    },
    zh:{
  nav_home:'主页',nav_intro:'介绍',nav_progress:'进展',nav_video:'视频',nav_history:'履历',nav_contact:'咨询',nav_signup:'注册',nav_login:'登录',nav_profile:'我的信息',nav_admin:'管理',nav_messages:'消息',
      price_today:'今日黄金行情 (3.75g)',supply_price:'供应价格 (3.75g)',section2_title:'非洲大陆的金脉',section3_title:'流通结构的创新',section4_title:'实际供应成果',section5_title:'立即咨询',section5_text:'与GoldStar一起开启新的投资机会',footer_company:'公司信息',footer_contact:'联系方式',footer_support:'客户支持',
  site_title:'公司主页',
  hook_line1:'“黄金终将上涨。”',hook_line2:'“但能以合理价格买入的时刻很短。”',hook_line3:'现在正是这个时刻，',hook_line4:'准备好了吗？',
  note_prev_change:'[以昨日为基准的波动幅度]',note_compare_now:'[与当前行情对比]',
  video1_desc:'请在此输入上方视频说明。',video2_desc:'请在此输入下方视频说明。',video_not_supported:'浏览器不支持视频。',
  alt_logo:'GoldStar 标志',alt_goldbar:'金条图片',alt_kakao:'Kakao 咨询',alt_telegram:'Telegram 咨询',
  footer_company_name:'公司名: GoldStar',footer_ceo:'代表理事: 洪吉童',footer_biz:'营业执照号: 123-45-67890',footer_mailorder:'电商执照: 第2025-首尔江南-0000号',footer_addr:'地址: 首尔市江南区德黑兰路123',footer_tel:'电话: 02-1234-5678',footer_email:'邮箱: info@goldstar.com',footer_fax:'传真: 02-1234-5679',footer_hours:'营业时间: 工作日 09:00 - 18:00',footer_lunch:'午休: 12:00 - 13:00',footer_off:'周末/法定节假日 休息',
  section2_stat_1_title:'3.2亿吨',section2_stat_1_desc:'2023年在乌干达发现黄金储量',
  section2_stat_2_title:'全球关注',section2_stat_2_desc:'价值评估12万亿韩元，CNN/BBC等媒体报道',
  section2_stat_3_title:'独家合约',section2_stat_3_desc:'与中国矿业公司签订独家开采合约 → GoldStar 签订进口合约',
  section4_title:'实际供应成果',section4_desc_total:'累计供应量',section4_desc_discount:'相对行情平均折扣率',section4_desc_members:'累计参与会员',
  aria_menu_open:'打开菜单',
  aria_lang_select:'语言选择',
  label_admin_tag:'[管理员]',
  messages_delete_confirm:'要删除这条消息吗？',
  aria_lang_select:'语言选择',
  carousel_desc_1:'确认矿区，基础全景',carousel_desc_2:'地下矿区采掘现场',carousel_desc_3:'乌干达金矿现场',carousel_desc_4:'矿区，人工筛选采掘 1',carousel_desc_5:'矿区，人工筛选采掘 2',carousel_desc_6:'人工分拣金粒',carousel_desc_7:'清洗后金粒筛选',carousel_desc_8:'清洗后金粒二次筛选',carousel_desc_9:'熔炼炉温度检查与投料',carousel_desc_10:'金含量初检',carousel_desc_11:'一次加工完成',carousel_desc_12:'矿区武装警卫',carousel_desc_13:'采矿合约现场',
      page_signup_title:'注册',label_username:'账号',btn_check_duplicate:'重复检测',dup_available:'可用的账号。',dup_unavailable:'账号已被占用。',dup_invalid_format:'格式错误 (字母/数字/下划线 3~20)',dup_enter_username:'请输入账号。',dup_need_check:'请执行重复检测。',label_name:'姓名',label_birth:'出生日期 (YYYY-MM-DD)',label_phone:'联系方式',label_email:'邮箱',label_password:'密码',label_password_confirm:'确认密码',label_bank:'银行',label_account:'账号',btn_signup_submit:'注册',err_required_all:'请填写所有项目。',err_need_dup_check:'请进行账号重复检测。',err_password_mismatch:'两次密码不一致。',err_email_format:'请输入正确的邮箱格式。',signup_success_redirect:'注册完成! 即将跳转至我的信息页面。',placeholder_username:'字母/数字/下划线 3~20',placeholder_account:'不含连字符数字',
      page_login_title:'登录',label_login_id:'账号',btn_login_submit:'登录',login_success:'登录成功',login_failed:'登录失败',
  page_profile_title:'我的信息',section_member_info:'会员基本信息',section_orders:'订单记录',section_messages:'1:1 咨询',btn_send:'发送',note_admin_only_reply:'只有管理员可以回复。',orders_empty:'无',messages_empty:'没有咨询。',btn_logout:'登出',btn_mock_order_add:'添加模拟订单',field_username:'账号',field_name:'姓名',field_birth:'出生日期',field_phone:'联系方式',field_email:'邮箱',field_bank:'银行',field_account:'账号',field_joined:'注册时间',field_role:'角色',status_unread:'未读',status_read:'已读',status_answered:'已回复',btn_mark_read:'标记已读',btn_reply:'回复',btn_order_add:'新增订单',btn_change_password:'修改密码',pw_change_success:'密码已修改。',pw_change_fail:'修改失败',
  page_admin_title:'管理员页面',section_users:'会员列表',section_add_user:'新增会员',btn_add_user:'添加',msg_required_fields:'必填项目',section_orders_admin:'订单管理',orders_empty_admin:'无订单',section_messages_admin:'1:1 咨询',messages_empty_admin:'无消息',section_admin_reply:'管理员回复',label_reply_email:'会员邮箱',label_reply_content:'回复内容',btn_send_reply:'发送回复',msg_add_success:'添加完成',msg_reply_success:'发送完成',action_delete:'删除',btn_edit:'编辑',btn_save:'保存',btn_cancel:'取消',btn_reset_pw:'改密',btn_add_order_admin:'新增订单',btn_edit_order:'编辑',msg_update_success:'修改完成',msg_update_fail:'修改失败',msg_pw_reset_success:'密码已更改',msg_pw_reset_fail:'更改失败',
  section_admin_info:'管理员信息',btn_refresh:'刷新',
  page_messages_title:'消息 / 1:1 咨询',placeholder_message:'请输入咨询内容',label_admin_tag:'[管理员]',messages_delete_confirm:'确定删除吗？',btn_delete:'删除'
    },
    en:{
  nav_home:'Home',nav_intro:'Intro',nav_progress:'Process',nav_video:'Video',nav_history:'History',nav_contact:'Contact',nav_signup:'Sign Up',nav_login:'Login',nav_profile:'My Info',nav_admin:'Admin',nav_messages:'Messages',
      price_today:"Today's Gold Price (3.75g)",supply_price:'Supply Price (3.75g)',section2_title:'Gold Vein of the Black Continent',section3_title:'Innovation in Distribution',section4_title:'Actual Supply Performance',section5_title:'Contact Us Now',section5_text:'Start a new investment opportunity with GoldStar',footer_company:'Company Info',footer_contact:'Contact',footer_support:'Support',
  site_title:'Company Website',
  hook_line1:'“Gold ultimately rises.”',hook_line2:'“But the window to buy at a fair price is short.”',hook_line3:'Now is that very moment,',hook_line4:'Are you ready?',
  note_prev_change:'[Change since yesterday]',note_compare_now:'[Compared to current price]',
  video1_desc:'Enter description for the top video here.',video2_desc:'Enter description for the bottom video here.',video_not_supported:'Your browser does not support video.',
  alt_logo:'GoldStar logo',alt_goldbar:'Gold bar image',alt_kakao:'Kakao inquiry',alt_telegram:'Telegram inquiry',
  footer_company_name:'Company: GoldStar',footer_ceo:'CEO: Hong Gil-dong',footer_biz:'Biz Reg No.: 123-45-67890',footer_mailorder:'Mail-order Reg.: 2025-SeoulGangnam-0000',footer_addr:'Address: 123 Teheran-ro, Gangnam-gu, Seoul',footer_tel:'Tel: +82-2-1234-5678',footer_email:'Email: info@goldstar.com',footer_fax:'Fax: +82-2-1234-5679',footer_hours:'Hours: Weekdays 09:00 - 18:00',footer_lunch:'Lunch: 12:00 - 13:00',footer_off:'Closed on weekends/holidays',
  section2_stat_1_title:'320 million tons',section2_stat_1_desc:'2023 Uganda gold reserves discovered',
  section2_stat_2_title:'Global Spotlight',section2_stat_2_desc:'Valued at 12T KRW; covered by CNN, BBC, etc.',
  section2_stat_3_title:'Exclusive Deals',section2_stat_3_desc:'Exclusive mining with Chinese firms → GoldStar import deals',
  section4_title:'Actual Supply Performance',section4_desc_total:'Total supplied',section4_desc_discount:'Avg. discount vs market',section4_desc_members:'Cumulative members',
  aria_menu_open:'Open menu',
  aria_lang_select:'Language select',
  label_admin_tag:'[Admin]',
  messages_delete_confirm:'Delete this message?',
  aria_lang_select:'Language select',
  carousel_desc_1:'Verifying site, overview',carousel_desc_2:'Underground mining site view',carousel_desc_3:'Uganda gold site view',carousel_desc_4:'On-site manual selection 1',carousel_desc_5:'On-site manual selection 2',carousel_desc_6:'Manual sorting of gold particles',carousel_desc_7:'Post-wash gold particle sorting',carousel_desc_8:'Second sorting after wash',carousel_desc_9:'Furnace temp check & feed',carousel_desc_10:'Initial fineness test',carousel_desc_11:'Primary processing complete',carousel_desc_12:'Mine security police',carousel_desc_13:'Mining contract scene',
      page_signup_title:'Sign Up',label_username:'Username',btn_check_duplicate:'Check',dup_available:'Username is available.',dup_unavailable:'Username already taken.',dup_invalid_format:'Invalid format (letters/numbers/_ 3-20)',dup_enter_username:'Enter a username.',dup_need_check:'Run duplicate check.',label_name:'Name',label_birth:'Birth (YYYY-MM-DD)',label_phone:'Phone',label_email:'Email',label_password:'Password',label_password_confirm:'Confirm Password',label_bank:'Bank',label_account:'Account Number',btn_signup_submit:'Register',err_required_all:'Please fill all fields.',err_need_dup_check:'Please run username duplicate check.',err_password_mismatch:'Passwords do not match.',err_email_format:'Enter a valid email.',signup_success_redirect:'Sign up complete! Redirecting...',placeholder_username:'Letters/Numbers/_ 3-20',placeholder_account:'Digits only',
      page_login_title:'Login',label_login_id:'Username',btn_login_submit:'Login',login_success:'Login success',login_failed:'Login failed',
  page_profile_title:'My Info',section_member_info:'Member Basic Info',section_orders:'Orders',section_messages:'1:1 Inquiry',btn_send:'Send',note_admin_only_reply:'Only admin can reply.',orders_empty:'None',messages_empty:'No inquiries.',btn_logout:'Logout',btn_mock_order_add:'Add Mock Order',field_username:'Username',field_name:'Name',field_birth:'Birth',field_phone:'Phone',field_email:'Email',field_bank:'Bank',field_account:'Account',field_joined:'Joined',field_role:'Role',status_unread:'Unread',status_read:'Read',status_answered:'Answered',btn_mark_read:'Mark Read',btn_reply:'Reply',btn_order_add:'Add Order',btn_change_password:'Change Password',pw_change_success:'Password updated.',pw_change_fail:'Password update failed',
  page_admin_title:'Admin Page',section_users:'Users',section_add_user:'Add User',btn_add_user:'Add',msg_required_fields:'Required fields missing',section_orders_admin:'Order Management',orders_empty_admin:'No orders',section_messages_admin:'1:1 Inquiry',messages_empty_admin:'No messages',section_admin_reply:'Admin Reply',label_reply_email:'User Email',label_reply_content:'Reply Content',btn_send_reply:'Send Reply',msg_add_success:'Added',msg_reply_success:'Sent',action_delete:'Delete',btn_edit:'Edit',btn_save:'Save',btn_cancel:'Cancel',btn_reset_pw:'Change PW',btn_add_order_admin:'Add Order',btn_edit_order:'Edit',msg_update_success:'Update complete',msg_update_fail:'Update failed',msg_pw_reset_success:'Password updated',msg_pw_reset_fail:'Password update failed',
  section_admin_info:'Admin Info',btn_refresh:'Refresh',
  page_messages_title:'Messages / 1:1 Inquiry',placeholder_message:'Enter your inquiry',label_admin_tag:'[Admin]',messages_delete_confirm:'Delete this message?',btn_delete:'Delete'
    }
  };

  function currentLang(){return localStorage.getItem('lang_pref')||'ko';}
  function t(key){ const lang=currentLang(); const dict=i18n[lang]||i18n.ko; return dict[key]|| (i18n.ko[key]|| key); }
  function applyLang(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n; el.textContent=t(k);});
    document.querySelectorAll('[data-i18n-html]').forEach(el=>{const k=el.dataset.i18nHtml; el.innerHTML=t(k);});
    document.querySelectorAll('[data-i18n-ph]').forEach(el=>{const k=el.dataset.i18nPh; el.setAttribute('placeholder', t(k));});
    document.querySelectorAll('[data-i18n-value]').forEach(el=>{const k=el.dataset.i18nValue; el.value=t(k);});
    document.querySelectorAll('[data-i18n-alt]').forEach(el=>{const k=el.dataset.i18nAlt; el.setAttribute('alt', t(k));});
    document.querySelectorAll('[data-i18n-title]').forEach(el=>{const k=el.dataset.i18nTitle; el.setAttribute('title', t(k));});
    document.querySelectorAll('[data-i18n-aria]').forEach(el=>{const k=el.dataset.i18nAria; el.setAttribute('aria-label', t(k));});
  }

  async function deriveKey(){
    const passBuf = encoder.encode(PASSPHRASE);
    const hash = await crypto.subtle.digest('SHA-256', passBuf);
    return crypto.subtle.importKey('raw', hash, {name:'AES-GCM'}, false, ['encrypt','decrypt']);
  }
  function toB64(buf){return btoa(String.fromCharCode(...new Uint8Array(buf)));}
  function fromB64(str){return Uint8Array.from(atob(str),c=>c.charCodeAt(0));}

  async function encrypt(obj){
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = encoder.encode(JSON.stringify(obj));
    const ct = await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, data);
    return toB64(iv)+'.'+toB64(ct);
  }
  async function decrypt(str){
    const key = await deriveKey();
    const [ivB64, ctB64] = str.split('.');
    if(!ivB64||!ctB64) throw new Error('bad format');
    const iv = fromB64(ivB64);
    const ct = fromB64(ctB64);
    const pt = await crypto.subtle.decrypt({name:'AES-GCM',iv}, key, ct);
    return JSON.parse(new TextDecoder().decode(pt));
  }

  async function loadDB(){
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if(!raw){
      const now = new Date().toISOString();
      const salt = randomHex(8);
      const adminUser = {
        email:'admin@goldstar.local', username:'admin',
        name:'Admin', birth:'1970-01-01', phone:'010-0000-0000', bank:'-', account:'-',
  passwordSalt:salt, passwordHash:await hashPassword('admin',salt), role:'admin',
        created:now, orders:[], messages:[]
      };
      const db = {users:{'admin@goldstar.local':adminUser}, usernameIndex:{'admin':'admin@goldstar.local'}, created:now, updated:now};
      await saveDB(db);
      return db;
    }
    try { return await decrypt(raw); } catch { return {users:{}, created:new Date().toISOString(), updated:new Date().toISOString()}; }
  }
  async function saveDB(db){ db.updated=new Date().toISOString(); localStorage.setItem(DB_STORAGE_KEY, await encrypt(db)); }

  function randomHex(len){return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(b=>b.toString(16).padStart(2,'0')).join('');}
  async function hashPassword(pw, salt){
    const data = encoder.encode(pw+':'+salt);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  let db = await loadDB();

  function ensureUsernameIndex(){
    if(!db.usernameIndex) db.usernameIndex={};
    // build missing usernames
    Object.values(db.users).forEach(u=>{
      if(u.username){
        const key = u.username.toLowerCase();
        if(!db.usernameIndex[key]) db.usernameIndex[key]=u.email;
      }
    });
  }
  ensureUsernameIndex();

  function isUsernameTaken(username){ if(!username) return false; ensureUsernameIndex(); return !!db.usernameIndex[username.toLowerCase()]; }
  async function signupUser({username,name,birth,phone,email,bank,account,password}){
    email = email.toLowerCase();
    if(db.users[email]) throw new Error('이미 존재하는 이메일입니다.');
    if(!username) throw new Error('아이디를 입력하세요.');
    if(isUsernameTaken(username)) throw new Error('이미 존재하는 아이디입니다.');
    const salt = randomHex(8);
    const user = {username,name,birth,phone,email,bank,account,role:'user',created:new Date().toISOString(),orders:[],messages:[],passwordSalt:salt,passwordHash:await hashPassword(password,salt)};
    db.users[email]=user; ensureUsernameIndex(); db.usernameIndex[username.toLowerCase()]=email; await saveDB(db); return user;
  }
  async function loginId(id,password){
    if(!id) throw new Error('아이디를 입력하세요.');
    const candidate = id.toLowerCase();
    ensureUsernameIndex();
    let email = null;
    // 우선 usernameIndex
    if(db.usernameIndex[candidate]) email = db.usernameIndex[candidate];
    else if(db.users[candidate]) email = candidate; // 혹시 이메일 직접 입력
    if(!email) throw new Error('존재하지 않는 아이디입니다.');
    const u=db.users[email];
    const hash=await hashPassword(password,u.passwordSalt);
    if(hash!==u.passwordHash) throw new Error('비밀번호가 일치하지 않습니다.');
    localStorage.setItem(CURRENT_KEY,email);
    // 접속 정보 업데이트
    try{
      u.lastLoginAt = new Date().toISOString();
      u.lastSeenAt = Date.now();
      u.lastLoginUA = navigator.userAgent||'';
      try{
        const res = await fetch('https://api.ipify.org?format=json', {cache:'no-store'});
        if(res.ok){ const j = await res.json(); if(j && j.ip) u.lastLoginIP = j.ip; }
      }catch(_){ /* ignore ip fetch failure */ }
      await saveDB(db);
    }catch(_){ /* ignore meta update failure */ }
    buildUserNav();
    return u;
  }
  function logout(){ localStorage.removeItem(CURRENT_KEY); buildUserNav(); }
  function currentUser(){ const email = localStorage.getItem(CURRENT_KEY); if(!email) return null; return db.users[email]||null; }

  async function addOrder(email, order){ order.id='O'+Date.now().toString(36); order.ts=Date.now(); db.users[email].orders.unshift(order); await saveDB(db); }

  async function addMessage(email, content, fromAdmin=false, replyTo){
    const user = db.users[email]; if(!user) throw new Error('user');
    const msg={ id:'M'+Date.now().toString(36), content, fromAdmin, replyTo: replyTo||null, ts:Date.now(), read: fromAdmin? true:false, answered:false };
    user.messages.push(msg);
    if(fromAdmin && replyTo){
      const orig=user.messages.find(m=>m.id===replyTo);
      if(orig){ orig.answered=true; orig.read=true; }
    }
    await saveDB(db);
  }

  function buildUserNav(){
    const area = document.getElementById('userArea'); if(!area) return;
    const user = currentUser();
    let html='';
    if(!user){
      html += '<a class="user-link" href="signup.html" data-i18n="nav_signup">회원가입</a>';
      html += '<a class="user-link" href="login.html" data-i18n="nav_login">로그인</a>';
    } else {
      if(user.role==='admin'){
        html += '<a class="user-link admin-link" href="admin-users.html" data-i18n-title="nav_admin" data-i18n-aria="nav_admin" title="관리" aria-label="관리">⚙️</a>';
        // 관리자: 내 정보 링크 숨김
      } else {
        html += '<a class="user-link" href="profile.html" data-i18n="nav_profile">내 정보</a>';
        html += '<a class="user-link" href="messages.html" data-i18n="nav_messages">쪽지</a>';
      }
    }
    area.innerHTML=html; applyLang();
  }

  // Migration for existing messages
  Object.values(db.users).forEach(u=>{ (u.messages||[]).forEach(m=>{ if(typeof m.read==='undefined') m.read = m.fromAdmin? true:false; if(typeof m.answered==='undefined') m.answered=false; }); });

  // Public expose (attach to window)
  async function changePassword(email,newPw){
    const user=db.users[email]; if(!user) throw new Error('user');
    const salt=randomHex(8); user.passwordSalt=salt; user.passwordHash=await hashPassword(newPw,salt); await saveDB(db); return true;
  }

  async function updateUser(email, patch){
    const u=db.users[email]; if(!u) throw new Error('user');
    Object.assign(u, patch||{}); await saveDB(db); return u;
  }

  async function updateOrder(email, orderId, patch){
    const u=db.users[email]; if(!u) throw new Error('user');
    const idx=(u.orders||[]).findIndex(o=>o.id===orderId); if(idx<0) throw new Error('order');
    u.orders[idx]=Object.assign({}, u.orders[idx], patch||{}); await saveDB(db); return u.orders[idx];
  }

  window.GSApp = { i18n, t, applyLang, signupUser, loginId, logout, currentUser, addOrder, addMessage, changePassword, updateUser, updateOrder, loadDB:async()=>{db=await loadDB();}, getDB:()=>db, saveDB:()=>saveDB(db), buildUserNav, hashPassword, isUsernameTaken };

  // Initialize language & nav

  document.addEventListener('DOMContentLoaded', ()=>{
    applyLang();
    buildUserNav();
    try{ const cu = currentUser(); if(cu){ cu.lastSeenAt = Date.now(); saveDB(db); } }catch(_){ }
    const langSel=document.getElementById('langSelect');
    if(langSel){ langSel.value=currentLang(); langSel.addEventListener('change',e=>{ localStorage.setItem('lang_pref',e.target.value); applyLang(); }); }
    // Auto-trigger refresh buttons on page load (if present)
    setTimeout(()=>{
      ['btnUsersRefresh','btnOrdersRefresh','btnInqRefresh'].forEach(id=>{
        const el = document.getElementById(id);
        if(el && typeof el.click === 'function'){
          try{ el.click(); }catch(_){ }
        }
      });
    }, 200);
  });
})();
