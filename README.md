# DecisionFlow

**회의 의사결정 보조 AI**

입력 키워드 맥락을 AI가 파악해 핵심 논의, 결정 항목, 의사결정 방식, 액션을 제안합니다.

## 기능

- 회의 키워드 입력 (태그, 복수 줄 붙여넣기)
- Harness 기반 4-Agent 파이프라인
- Mistral API 연동 (오프라인 규칙 기반 폴백 지원)
- Vue Flow Agent 파이프라인 시각화

## 기술 스택

- Vue 3 + TypeScript + Vite
- Pinia + Tailwind CSS v4
- Mistral API
- Vue Flow
- Netlify 배포

## 시작하기

```bash
npm install
cp .env.example .env
# .env에 VITE_MISTRAL_API_KEY 설정 (선택, 없으면 오프라인 모드)
npm run dev
```

## Agent 구조

1. Topic Extractor — 핵심 논의 추출
2. Decision Analyzer — 결정 항목 생성
3. Framework Recommender — 의사결정 방식 추천
4. Action Generator — 액션 아이템 생성

## 배포

Netlify: `netlify.toml` 참고, 환경 변수에 `VITE_MISTRAL_API_KEY` 설정

## 저장소

https://github.com/Ninano9/decision-flow-test
