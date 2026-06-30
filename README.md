# Sstarboard

한국 개인 투자자를 위한 금융 종합 대시보드.

## 제공 데이터 (1단계 MVP)

| 섹션 | 데이터 | 출처 |
|------|--------|------|
| 거시경제 | VIX, 미국·한국 금리, 원달러 환율 | Yahoo Finance |
| 미국주식 | SPY, QQQ, CNN 공포탐욕지수, 11개 섹터 점수 | Yahoo Finance, CNN, Google News RSS |
| AI 시황 | Gemini 1.5 Flash 종합 분석 | Google AI |

## 로컬 실행 방법

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경변수 설정**

   `.env.local.example`을 복사해 `.env.local` 파일을 만들고 API 키를 입력합니다.
   ```bash
   cp .env.local.example .env.local
   ```

   | 변수 | 설명 | 발급 |
   |------|------|------|
   | `GEMINI_API_KEY` | Google Gemini AI API 키 (필수) | [Google AI Studio](https://aistudio.google.com/app/apikey) |

3. **개발 서버 시작**
   ```bash
   npm run dev
   ```
   http://localhost:3000 에서 확인

4. **테스트 실행**
   ```bash
   npm test
   ```

## Vercel 배포

1. Vercel에 GitHub 레포를 연결합니다.
2. Vercel 대시보드 → Settings → Environment Variables에 `GEMINI_API_KEY`를 추가합니다.
3. 배포 후 자동으로 서버사이드 API Routes가 활성화됩니다.

## 보안 주의사항

- `GEMINI_API_KEY`는 서버사이드에서만 사용됩니다 (`NEXT_PUBLIC_` 접두사 없음).
- 모든 외부 API 호출은 `/app/api/` 라우트를 통해 서버에서 이루어집니다.
