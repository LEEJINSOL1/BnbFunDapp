# 1️⃣ 기본 인프라 설정 & 기술 검토


❌ 도메인 및 호스팅 : cafe24


❌ 데이터베이스 구조 설계 (토큰, 사용자, 트랜잭션 등)
 

✅ 스마트 컨트랙트 설계 (BEP-20 토큰 생성 및 유동성 추가 가능 여부 검토) *BSC TESTNET


# 2️⃣ MetaMask 연동 및 BEP-20 토큰 생성 기능 개발


✅ MetaMask 연결 구현 (BNB 체인 상에서 작동) *BSC TESTNET


✅ BEP-20 토큰 생성 기능 구현 *BSC TESTNET


✅ PancakeSwap 유동성 풀 자동 추가 *BSC TESTNET


# 3️⃣ 토큰 관리 & 거래 기능 추가


✅ 사용자가 만든 토큰 목록 보기


❌ 토큰 정보 (이름, 심볼, 가격, 유동성) 조회


❌ 토큰 매매 기능 구현 (swap 기능)

# 4️⃣ UI/UX 개발 및 배포


✅ 프론트엔드 개발 (React + Ethers.js 등 사용 가능)

ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

## 1. 개발환경 세팅
운영체제: Windows 11
Node.js (npm 포함) (스마트 컨트랙트 및 프론트엔드 개발)
에디터 및 IDE:
Visual Studio Code + Solidity, React 확장 플러그인


Foundry (스마트 컨트랙트 개발 및 테스트)


버전 관리: Git 및 GitHub


테스트넷 및 블록체인 상호작용: MetaMask (BNB 체인 테스트 및 트랜잭션 확인) BNB Smart Chain Testnet


## 2. 개발 언어 및 스택


① 프론트엔드 (웹 개발) 


프레임워크: Next.js (React 기반, 서버사이드 렌더링 지원)


UI 라이브러리: Tailwind CSS + shadcn/ui


지갑 연동: ethers.js


② 백엔드


서버 개발: Node.js + Express (필요 시 API 서버)


데이터베이스: Firebase, 


캐싱: Redis (트랜잭션 처리 속도 향상)


파일 저장소: IPFS (NFT 또는 토큰 관련 이미지 저장 시)


③ 블록체인 스마트 컨트랙트


언어: Solidity (BEP-20 토큰, 유동성 풀 자동 생성)


개발 프레임워크: Hardhat 또는 Foundry


테스트넷: BNB Smart Chain Testnet (Sepolia와 유사)


라이브러리: OpenZeppelin (ERC/BEP 표준 구현)


④ 배포 및 운영
도메인 및 SSL: Cafe24 


웹 호스팅: cafe24 


모니터링: The Graph (블록체인 데이터 인덱싱)
ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ


2025.5.27. : 토큰생성시 이미지 IPFS에저장 / MYSQL tokens 테이블에 IMG_URL 추가 /  토큰생성시 DB에 저장하고 프론트앤드(화면)에표시 
* TO DO LIST
  
  ✅. 토큰리스트에도 토큰이미지 표시 -> 구현완료 (2025-05-27  2038)
  
  🔼. 토큰생성시 트위터,텔레그램 등 링크 반영 -> 현재 토큰생성시 해당 정보들이 db로 저장되는것까지는 구현완료 (2025-05-27  2038)
  
  ✅. 토큰리스트에서 토큰 검색기능 추가 (2025-05-27  2038)
  
  ✅. 좌측상단에 토큰 주소 표시(복사)기능 구현
  
  ✅. 토큰 별 댓글기능 구현 (2025-05-27  2038)
 






