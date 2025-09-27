const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain", function () {
  let supplyChain;
  let owner, farmer, distributor, retailer, consumer;

  beforeEach(async function () {
    [owner, farmer, distributor, retailer, consumer] = await ethers.getSigners();
    
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    // Authorize users
    await supplyChain.authorizeUser(farmer.address, 0); // Farmer
    await supplyChain.authorizeUser(distributor.address, 1); // Distributor
    await supplyChain.authorizeUser(retailer.address, 2); // Retailer
  });

  describe("User Authorization", function () {
    it("Should authorize users with correct roles", async function () {
      expect(await supplyChain.isAuthorized(farmer.address)).to.be.true;
      expect(await supplyChain.getUserRole(farmer.address)).to.equal(0);
    });

    it("Should only allow owner to authorize users", async function () {
      await expect(
        supplyChain.connect(farmer).authorizeUser(consumer.address, 3)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Product Registration", function () {
    it("Should register product successfully", async function () {
      const tx = await supplyChain.connect(farmer).registerProduct(
        "Test Product",
        "Test Description",
        "QmTestHash"
      );

      await expect(tx)
        .to.emit(supplyChain, "ProductRegistered")
        .withArgs(1, "Test Product", farmer.address, "QmTestHash");

      const product = await supplyChain.getProduct(1);
      expect(product.name).to.equal("Test Product");
      expect(product.farmer).to.equal(farmer.address);
      expect(product.status).to.equal(0); // Registered
    });

    it("Should only allow farmers to register products", async function () {
      await expect(
        supplyChain.connect(distributor).registerProduct("Test", "Test", "Hash")
      ).to.be.revertedWith("Insufficient role permissions");
    });
  });

  describe("Status Updates", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).registerProduct(
        "Test Product",
        "Test Description", 
        "QmTestHash"
      );
    });

    it("Should update status with proper role validation", async function () {
      // Farmer can set InTransit
      await supplyChain.connect(farmer).updateStatus(1, 1);
      let product = await supplyChain.getProduct(1);
      expect(product.status).to.equal(1);

      // Distributor can set Distributed
      await supplyChain.connect(distributor).updateStatus(1, 2);
      product = await supplyChain.getProduct(1);
      expect(product.status).to.equal(2);

      // Retailer can set Sold
      await supplyChain.connect(retailer).updateStatus(1, 3);
      product = await supplyChain.getProduct(1);
      expect(product.status).to.equal(3);
    });

    it("Should reject invalid status transitions", async function () {
      await expect(
        supplyChain.connect(retailer).updateStatus(1, 1)
      ).to.be.revertedWith("Only farmer or distributor can set InTransit");
    });
  });

  describe("Price Updates", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).registerProduct(
        "Test Product",
        "Test Description",
        "QmTestHash"
      );
    });

    it("Should record price updates correctly", async function () {
      const price = ethers.parseEther("0.01");
      
      await expect(supplyChain.connect(farmer).updatePrice(1, price))
        .to.emit(supplyChain, "PriceUpdated")
        .withArgs(1, price, farmer.address);

      const priceHistory = await supplyChain.getPriceHistory(1);
      expect(priceHistory.length).to.equal(1);
      expect(priceHistory[0].price).to.equal(price);
      expect(priceHistory[0].updatedBy).to.equal(farmer.address);
    });

    it("Should reject zero price", async function () {
      await expect(
        supplyChain.connect(farmer).updatePrice(1, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Product Queries", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).registerProduct("Product 1", "Desc 1", "Hash1");
      await supplyChain.connect(farmer).registerProduct("Product 2", "Desc 2", "Hash2");
    });

    it("Should return products by farmer", async function () {
      const products = await supplyChain.getProductsByFarmer(farmer.address);
      expect(products.length).to.equal(2);
      expect(products[0]).to.equal(1);
      expect(products[1]).to.equal(2);
    });

    it("Should return all products", async function () {
      const products = await supplyChain.getAllProducts();
      expect(products.length).to.equal(2);
    });

    it("Should revert for non-existent product", async function () {
      await expect(supplyChain.getProduct(999))
        .to.be.revertedWith("Product does not exist");
    });
  });
});
