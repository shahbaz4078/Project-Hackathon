// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    enum Role { Farmer, Distributor, Retailer, Consumer }
    enum Status { Registered, InTransit, Distributed, Sold }

    struct Product {
        uint256 id;
        string name;
        string description;
        string ipfsHash;
        address farmer;
        Status status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct PriceRecord {
        uint256 price;
        address updatedBy;
        uint256 timestamp;
        Status statusAtTime;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => PriceRecord[]) public priceHistory;
    mapping(address => Role) public userRoles;
    mapping(address => bool) public authorizedUsers;
    
    uint256 public productCounter;
    address public owner;

    event ProductRegistered(uint256 indexed productId, string name, address indexed farmer, string ipfsHash);
    event StatusUpdated(uint256 indexed productId, Status newStatus, address indexed updatedBy);
    event PriceUpdated(uint256 indexed productId, uint256 price, address indexed updatedBy);
    event UserAuthorized(address indexed user, Role role);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender], "User not authorized");
        _;
    }

    modifier onlyRole(Role _role) {
        require(userRoles[msg.sender] == _role, "Insufficient role permissions");
        _;
    }

    modifier productExists(uint256 _productId) {
        require(_productId > 0 && _productId <= productCounter, "Product does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedUsers[msg.sender] = true;
        userRoles[msg.sender] = Role.Farmer;
    }

    function authorizeUser(address _user, Role _role) external onlyOwner {
        authorizedUsers[_user] = true;
        userRoles[_user] = _role;
        emit UserAuthorized(_user, _role);
    }

    function registerProduct(
        string memory _name,
        string memory _description,
        string memory _ipfsHash
    ) external onlyAuthorized onlyRole(Role.Farmer) returns (uint256) {
        productCounter++;
        
        products[productCounter] = Product({
            id: productCounter,
            name: _name,
            description: _description,
            ipfsHash: _ipfsHash,
            farmer: msg.sender,
            status: Status.Registered,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit ProductRegistered(productCounter, _name, msg.sender, _ipfsHash);
        return productCounter;
    }

    function updateStatus(uint256 _productId, Status _newStatus) 
        external 
        onlyAuthorized 
        productExists(_productId) 
    {
        Product storage product = products[_productId];
        
        // Role-based status transition validation
        if (_newStatus == Status.InTransit) {
            require(userRoles[msg.sender] == Role.Farmer || userRoles[msg.sender] == Role.Distributor, 
                   "Only farmer or distributor can set InTransit");
        } else if (_newStatus == Status.Distributed) {
            require(userRoles[msg.sender] == Role.Distributor || userRoles[msg.sender] == Role.Retailer, 
                   "Only distributor or retailer can set Distributed");
        } else if (_newStatus == Status.Sold) {
            require(userRoles[msg.sender] == Role.Retailer, "Only retailer can set Sold");
        }

        product.status = _newStatus;
        product.updatedAt = block.timestamp;
        
        emit StatusUpdated(_productId, _newStatus, msg.sender);
    }

    function updatePrice(uint256 _productId, uint256 _price) 
        external 
        onlyAuthorized 
        productExists(_productId) 
    {
        require(_price > 0, "Price must be greater than 0");
        
        Product storage product = products[_productId];
        
        priceHistory[_productId].push(PriceRecord({
            price: _price,
            updatedBy: msg.sender,
            timestamp: block.timestamp,
            statusAtTime: product.status
        }));

        emit PriceUpdated(_productId, _price, msg.sender);
    }

    function getProduct(uint256 _productId) 
        external 
        view 
        productExists(_productId) 
        returns (Product memory) 
    {
        return products[_productId];
    }

    function getPriceHistory(uint256 _productId) 
        external 
        view 
        productExists(_productId) 
        returns (PriceRecord[] memory) 
    {
        return priceHistory[_productId];
    }

    function getProductsByFarmer(address _farmer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory farmerProducts = new uint256[](productCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= productCounter; i++) {
            if (products[i].farmer == _farmer) {
                farmerProducts[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = farmerProducts[i];
        }
        
        return result;
    }

    function getAllProducts() external view returns (uint256[] memory) {
        uint256[] memory allProducts = new uint256[](productCounter);
        for (uint256 i = 1; i <= productCounter; i++) {
            allProducts[i-1] = i;
        }
        return allProducts;
    }

    function getUserRole(address _user) external view returns (Role) {
        return userRoles[_user];
    }

    function isAuthorized(address _user) external view returns (bool) {
        return authorizedUsers[_user];
    }
}
