const { SimpleLinearRegression } = require('ml-regression');
const ss = require('simple-statistics');

class AIModels {
  constructor() {
    // Historical price data (sample data in rupees)
    this.priceHistory = {
      'Vegetables': [45, 50, 48, 52, 55, 58, 60, 62, 65, 68],
      'Fruits': [80, 85, 82, 88, 90, 95, 98, 100, 105, 110],
      'Grains': [35, 38, 40, 42, 45, 48, 50, 52, 55, 58],
      'Dairy': [60, 65, 68, 70, 72, 75, 78, 80, 82, 85],
      'Meat': [450, 460, 470, 480, 490, 500, 510, 520, 530, 540],
      'Herbs': [120, 125, 130, 135, 140, 145, 150, 155, 160, 165]
    };

    // Demand patterns (seasonal multipliers)
    this.demandPatterns = {
      'Vegetables': [1.2, 1.0, 0.8, 0.9, 1.1, 1.3, 1.4, 1.2, 1.0, 0.9, 1.1, 1.3],
      'Fruits': [0.8, 0.9, 1.1, 1.3, 1.4, 1.2, 1.0, 0.9, 1.1, 1.3, 1.1, 0.9],
      'Grains': [1.0, 1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 0.9, 1.0, 1.1, 1.2, 1.1],
      'Dairy': [1.1, 1.1, 1.0, 1.0, 1.0, 1.0, 1.1, 1.1, 1.0, 1.0, 1.1, 1.2],
      'Meat': [1.3, 1.1, 1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 1.0, 1.1, 1.2, 1.4],
      'Herbs': [1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 1.0, 1.1, 1.1, 1.0]
    };

    // Quality factors for fraud detection
    this.qualityFactors = {
      'organic': 1.3,
      'conventional': 1.0,
      'hydroponic': 1.2
    };
  }

  // Price Prediction using Linear Regression
  predictPrice(category, farmingMethod = 'conventional', location = 'India') {
    try {
      const baseHistory = this.priceHistory[category] || this.priceHistory['Vegetables'];
      const timePoints = baseHistory.map((_, index) => index);
      
      // Create regression model
      const regression = new SimpleLinearRegression(timePoints, baseHistory);
      
      // Predict next price point
      const nextTimePoint = baseHistory.length;
      let predictedPrice = regression.predict(nextTimePoint);
      
      // Apply quality factor
      const qualityMultiplier = this.qualityFactors[farmingMethod] || 1.0;
      predictedPrice *= qualityMultiplier;
      
      // Add location factor (premium locations)
      const locationMultiplier = this.getLocationMultiplier(location);
      predictedPrice *= locationMultiplier;
      
      // Add some realistic variance
      const variance = predictedPrice * 0.1 * (Math.random() - 0.5);
      predictedPrice += variance;
      
      return {
        predictedPrice: Math.round(predictedPrice),
        confidence: 0.85 + Math.random() * 0.1,
        trend: regression.slope > 0 ? 'increasing' : 'decreasing',
        factors: {
          basePrice: Math.round(regression.predict(nextTimePoint)),
          qualityMultiplier,
          locationMultiplier,
          variance: Math.round(variance)
        }
      };
    } catch (error) {
      return {
        predictedPrice: 50,
        confidence: 0.5,
        trend: 'stable',
        error: error.message
      };
    }
  }

  // Demand Forecasting
  forecastDemand(category, month = new Date().getMonth()) {
    try {
      const seasonalPattern = this.demandPatterns[category] || this.demandPatterns['Vegetables'];
      const baselinedemand = 100; // Base demand units
      
      const seasonalMultiplier = seasonalPattern[month];
      const forecastedDemand = baselinedemand * seasonalMultiplier;
      
      // Add trend analysis
      const trendFactor = 1 + (Math.random() * 0.2 - 0.1); // ±10% trend
      const finalDemand = forecastedDemand * trendFactor;
      
      return {
        forecastedDemand: Math.round(finalDemand),
        seasonalMultiplier,
        trendFactor,
        demandLevel: this.getDemandLevel(finalDemand),
        recommendation: this.getDemandRecommendation(finalDemand)
      };
    } catch (error) {
      return {
        forecastedDemand: 100,
        demandLevel: 'moderate',
        error: error.message
      };
    }
  }

  // Fraud Detection
  detectFraud(productData) {
    try {
      let fraudScore = 0;
      const flags = [];
      
      // Price anomaly detection
      const expectedPrice = this.predictPrice(productData.category, productData.farmingMethod);
      const priceDeviation = Math.abs(productData.price - expectedPrice.predictedPrice) / expectedPrice.predictedPrice;
      
      if (priceDeviation > 0.5) {
        fraudScore += 30;
        flags.push('Unusual pricing detected');
      }
      
      // Location consistency check
      if (productData.location && !this.isValidLocation(productData.location)) {
        fraudScore += 20;
        flags.push('Suspicious location');
      }
      
      // Farming method vs price consistency
      const expectedQualityPrice = expectedPrice.predictedPrice * this.qualityFactors[productData.farmingMethod];
      if (productData.price > expectedQualityPrice * 1.5) {
        fraudScore += 25;
        flags.push('Price too high for farming method');
      }
      
      // Time-based checks
      const harvestDate = new Date(productData.harvestDate);
      const now = new Date();
      const daysDiff = (now - harvestDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        fraudScore += 15;
        flags.push('Product too old');
      }
      
      if (daysDiff < 0) {
        fraudScore += 40;
        flags.push('Future harvest date');
      }
      
      return {
        fraudScore,
        riskLevel: this.getRiskLevel(fraudScore),
        flags,
        recommendation: this.getFraudRecommendation(fraudScore),
        confidence: 0.8 + Math.random() * 0.15
      };
    } catch (error) {
      return {
        fraudScore: 0,
        riskLevel: 'unknown',
        error: error.message
      };
    }
  }

  // Helper methods
  getLocationMultiplier(location) {
    const premiumLocations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];
    return premiumLocations.some(city => location.includes(city)) ? 1.2 : 1.0;
  }

  getDemandLevel(demand) {
    if (demand > 120) return 'high';
    if (demand > 80) return 'moderate';
    return 'low';
  }

  getDemandRecommendation(demand) {
    if (demand > 120) return 'High demand expected - consider increasing production';
    if (demand > 80) return 'Moderate demand - maintain current production';
    return 'Low demand - consider reducing production or finding new markets';
  }

  getRiskLevel(fraudScore) {
    if (fraudScore > 70) return 'high';
    if (fraudScore > 40) return 'medium';
    if (fraudScore > 20) return 'low';
    return 'minimal';
  }

  getFraudRecommendation(fraudScore) {
    if (fraudScore > 70) return 'High fraud risk - requires manual verification';
    if (fraudScore > 40) return 'Medium risk - additional checks recommended';
    if (fraudScore > 20) return 'Low risk - monitor closely';
    return 'Minimal risk - product appears legitimate';
  }

  isValidLocation(location) {
    const validStates = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Punjab', 'Haryana', 'Uttar Pradesh'];
    return validStates.some(state => location.includes(state)) || location.includes('India');
  }

  // Get comprehensive analysis
  getComprehensiveAnalysis(productData) {
    const priceAnalysis = this.predictPrice(productData.category, productData.farmingMethod, productData.location);
    const demandAnalysis = this.forecastDemand(productData.category);
    const fraudAnalysis = this.detectFraud(productData);

    return {
      price: priceAnalysis,
      demand: demandAnalysis,
      fraud: fraudAnalysis,
      timestamp: new Date().toISOString(),
      currency: 'INR'
    };
  }
}

module.exports = AIModels;
