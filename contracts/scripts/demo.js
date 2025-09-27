const hre = require("hardhat");

async function main() {
  console.log("Running Supply Chain Demo...");

  // Get signers
  const [owner, farmer, distributor, retailer] = await hre.ethers.getSigners();
  
  // Deploy contract
  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();
  
  const contractAddress = await supplyChain.getAddress();
  console.log("Contract deployed to:", contractAddress);

  // Authorize users
  console.log("\n1. Authorizing users...");
  await supplyChain.authorizeUser(farmer.address, 0); // Farmer
  await supplyChain.authorizeUser(distributor.address, 1); // Distributor  
  await supplyChain.authorizeUser(retailer.address, 2); // Retailer
  
  console.log("✓ Farmer authorized:", farmer.address);
  console.log("✓ Distributor authorized:", distributor.address);
  console.log("✓ Retailer authorized:", retailer.address);

  // Register product as farmer
  console.log("\n2. Farmer registering product...");
  const tx1 = await supplyChain.connect(farmer).registerProduct(
    "Organic Tomatoes",
    "Fresh organic tomatoes from local farm",
    "QmSampleIPFSHash123"
  );
  const receipt1 = await tx1.wait();
  const productId = 1;
  
  console.log("✓ Product registered with ID:", productId);

  // Add initial price
  await supplyChain.connect(farmer).updatePrice(productId, hre.ethers.parseEther("0.01"));
  console.log("✓ Initial price set: 0.01 ETH");

  // Distributor updates status and price
  console.log("\n3. Distributor processing...");
  await supplyChain.connect(distributor).updateStatus(productId, 1); // InTransit
  await supplyChain.connect(distributor).updatePrice(productId, hre.ethers.parseEther("0.015"));
  console.log("✓ Status updated to InTransit");
  console.log("✓ Distributor price set: 0.015 ETH");

  // Retailer updates status and price
  console.log("\n4. Retailer processing...");
  await supplyChain.connect(retailer).updateStatus(productId, 2); // Distributed
  await supplyChain.connect(retailer).updatePrice(productId, hre.ethers.parseEther("0.02"));
  console.log("✓ Status updated to Distributed");
  console.log("✓ Retail price set: 0.02 ETH");

  // Final sale
  await supplyChain.connect(retailer).updateStatus(productId, 3); // Sold
  console.log("✓ Product marked as Sold");

  // Get product details
  console.log("\n5. Product Details:");
  const product = await supplyChain.getProduct(productId);
  console.log("Name:", product.name);
  console.log("Description:", product.description);
  console.log("Farmer:", product.farmer);
  console.log("Status:", ["Registered", "InTransit", "Distributed", "Sold"][product.status]);
  console.log("IPFS Hash:", product.ipfsHash);

  // Get price history
  console.log("\n6. Price History:");
  const priceHistory = await supplyChain.getPriceHistory(productId);
  priceHistory.forEach((record, index) => {
    console.log(`${index + 1}. ${hre.ethers.formatEther(record.price)} ETH by ${record.updatedBy} at status ${record.statusAtTime}`);
  });

  console.log("\n✅ Demo completed successfully!");
  console.log("Contract Address:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
