import type { SectorId } from '../types'

export const NEWS_KEYWORDS: Record<SectorId, string> = {
  technology: 'semiconductor OR "AI chip" OR "artificial intelligence" OR "cloud computing" OR NVIDIA OR Apple OR Microsoft OR "tech stocks"',
  healthcare: 'pharmaceutical OR biotech OR FDA OR "drug approval" OR "healthcare earnings" OR Pfizer OR "medical device" OR "health sector"',
  financials: '"Federal Reserve" OR "bank earnings" OR "interest rate" OR JPMorgan OR "credit market" OR fintech OR "bank stocks"',
  energy: '"oil price" OR "crude oil" OR "natural gas" OR OPEC OR "energy sector" OR Chevron OR Exxon OR "energy stocks"',
  'consumer-discretionary': '"consumer spending" OR retail OR Amazon OR Tesla OR "luxury goods" OR "e-commerce" OR "consumer discretionary"',
  'consumer-staples': '"consumer staples" OR Walmart OR grocery OR "food prices" OR Procter OR "household goods" OR "defensive stocks"',
  industrials: '"industrial sector" OR Boeing OR Caterpillar OR "supply chain" OR manufacturing OR "defense spending" OR "infrastructure"',
  'real-estate': 'REIT OR "real estate" OR "mortgage rate" OR "housing market" OR "commercial real estate" OR "property stocks"',
  utilities: 'utilities OR "electricity demand" OR "power grid" OR "clean energy" OR "utility stocks" OR "renewable energy"',
  materials: '"raw materials" OR copper OR gold OR steel OR "mining sector" OR lithium OR "commodity prices" OR "materials sector"',
  'communication-services': '"social media" OR streaming OR Meta OR Alphabet OR Netflix OR telecom OR "advertising revenue" OR "media stocks"',
}
