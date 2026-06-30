export const MACRO_TOOLTIPS: Record<string, { title: string; description: string }> = {
  vix: {
    title: 'VIX 공포지수란?',
    description: '시장의 변동성과 불안 심리를 나타내는 지수입니다. 20 이하는 안정, 30 이상은 불안 구간으로 봅니다. CBOE에서 S&P 500 옵션 가격을 기반으로 산출합니다.',
  },
  usFedRate: {
    title: '미국 기준금리란?',
    description: '미 연준(Federal Reserve)이 결정하는 기준금리입니다. 13주 T-Bill 수익률(^IRX)을 참고 지표로 사용합니다. 금리가 높을수록 성장주에 부담, 가치주·배당주에 유리한 경향이 있습니다.',
  },
  usdKrw: {
    title: '원달러 환율이란?',
    description: '1달러를 사기 위해 필요한 원화 금액입니다. 원화 약세(환율 상승)는 수출 기업에 유리하지만, 미국 주식 투자 시 환전 비용이 증가합니다.',
  },
  krRate: {
    title: '한국 기준금리란?',
    description: '한국은행이 결정하는 기준금리입니다. 한국 국채 3년물 수익률(KR3YT=RR)을 참고 지표로 사용합니다. 금리 인하는 부동산·성장주에 유리한 경향이 있습니다.',
  },
}
