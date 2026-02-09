// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title BaibelRegistry
 * @notice Registry for document collections with attestation system
 * @dev PR #7: Collection registration and rating system
 */
contract BaibelRegistry is Ownable {
    // ============ Structs ============
    
    struct Collection {
        string id;
        string name;
        address author;
        string version;
        uint256 docCount;
        string ipfsHash;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct Attestation {
        address rater;
        uint8 rating; // 1-5
        string review;
        uint256 timestamp;
    }
    
    // ============ Errors ============
    
    error CollectionAlreadyExists();
    error CollectionNotFound();
    error NotCollectionAuthor();
    error InvalidRating();
    error SelfRatingNotAllowed();
    error EmptyCollectionId();
    error EmptyName();
    error EmptyIpfsHash();
    
    // ============ Events ============
    
    event CollectionRegistered(
        string indexed id,
        string name,
        address indexed author,
        string version,
        uint256 docCount,
        string ipfsHash,
        uint256 timestamp
    );
    
    event CollectionUpdated(
        string indexed id,
        string name,
        string version,
        uint256 docCount,
        string ipfsHash,
        uint256 timestamp
    );
    
    event AttestationSubmitted(
        string indexed collectionId,
        address indexed rater,
        uint8 rating,
        string review,
        uint256 timestamp
    );
    
    // ============ State ============
    
    /// @dev Collection ID => Collection
    mapping(string => Collection) private collections;
    
    /// @dev Collection ID => Rater address => Attestation
    mapping(string => mapping(address => Attestation)) private attestations;
    
    /// @dev Collection ID => All raters (for iteration)
    mapping(string => address[]) private collectionRaters;
    
    /// @dev Author address => Collection IDs
    mapping(address => string[]) private authorCollections;
    
    /// @dev Track if a collection exists
    mapping(string => bool) private collectionExists;
    
    /// @dev Track if a rater has attested to a collection
    mapping(string => mapping(address => bool)) private hasAttested;
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ External Functions ============
    
    /**
     * @notice Register a new collection
     * @param id Unique collection identifier
     * @param name Human-readable name
     * @param version Version string
     * @param docCount Number of documents in collection
     * @param ipfsHash IPFS hash pointing to collection metadata
     */
    function registerCollection(
        string calldata id,
        string calldata name,
        string calldata version,
        uint256 docCount,
        string calldata ipfsHash
    ) external {
        if (bytes(id).length == 0) revert EmptyCollectionId();
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(ipfsHash).length == 0) revert EmptyIpfsHash();
        if (collectionExists[id]) revert CollectionAlreadyExists();
        
        uint256 timestamp = block.timestamp;
        
        collections[id] = Collection({
            id: id,
            name: name,
            author: msg.sender,
            version: version,
            docCount: docCount,
            ipfsHash: ipfsHash,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        
        collectionExists[id] = true;
        authorCollections[msg.sender].push(id);
        
        emit CollectionRegistered(
            id,
            name,
            msg.sender,
            version,
            docCount,
            ipfsHash,
            timestamp
        );
    }
    
    /**
     * @notice Update an existing collection
     * @param id Collection identifier
     * @param name New name
     * @param version New version
     * @param docCount New document count
     * @param ipfsHash New IPFS hash
     */
    function updateCollection(
        string calldata id,
        string calldata name,
        string calldata version,
        uint256 docCount,
        string calldata ipfsHash
    ) external {
        if (!collectionExists[id]) revert CollectionNotFound();
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(ipfsHash).length == 0) revert EmptyIpfsHash();
        
        Collection storage collection = collections[id];
        if (collection.author != msg.sender) revert NotCollectionAuthor();
        
        uint256 timestamp = block.timestamp;
        
        collection.name = name;
        collection.version = version;
        collection.docCount = docCount;
        collection.ipfsHash = ipfsHash;
        collection.updatedAt = timestamp;
        
        emit CollectionUpdated(
            id,
            name,
            version,
            docCount,
            ipfsHash,
            timestamp
        );
    }
    
    /**
     * @notice Submit or update an attestation (rating/review) for a collection
     * @param collectionId Collection identifier
     * @param rating 1-5 star rating
     * @param review Optional text review
     */
    function submitAttestation(
        string calldata collectionId,
        uint8 rating,
        string calldata review
    ) external {
        if (!collectionExists[collectionId]) revert CollectionNotFound();
        if (rating < 1 || rating > 5) revert InvalidRating();
        
        Collection memory collection = collections[collectionId];
        if (collection.author == msg.sender) revert SelfRatingNotAllowed();
        
        uint256 timestamp = block.timestamp;
        
        // If first attestation, add rater to list
        if (!hasAttested[collectionId][msg.sender]) {
            collectionRaters[collectionId].push(msg.sender);
            hasAttested[collectionId][msg.sender] = true;
        }
        
        attestations[collectionId][msg.sender] = Attestation({
            rater: msg.sender,
            rating: rating,
            review: review,
            timestamp: timestamp
        });
        
        emit AttestationSubmitted(
            collectionId,
            msg.sender,
            rating,
            review,
            timestamp
        );
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get collection details
     * @param id Collection identifier
     * @return Collection struct
     */
    function getCollection(string calldata id) external view returns (Collection memory) {
        if (!collectionExists[id]) revert CollectionNotFound();
        return collections[id];
    }
    
    /**
     * @notice Get all collection IDs by author
     * @param author Author address
     * @return Array of collection IDs
     */
    function getCollectionsByAuthor(address author) external view returns (string[] memory) {
        return authorCollections[author];
    }
    
    /**
     * @notice Get attestation by rater for a collection
     * @param collectionId Collection identifier
     * @param rater Rater address
     * @return Attestation struct
     */
    function getAttestation(string calldata collectionId, address rater) 
        external 
        view 
        returns (Attestation memory) 
    {
        return attestations[collectionId][rater];
    }
    
    /**
     * @notice Get all attestations for a collection
     * @param collectionId Collection identifier
     * @return Array of Attestation structs
     */
    function getAttestations(string calldata collectionId) 
        external 
        view 
        returns (Attestation[] memory) 
    {
        address[] memory raters = collectionRaters[collectionId];
        Attestation[] memory result = new Attestation[](raters.length);
        
        for (uint256 i = 0; i < raters.length; i++) {
            result[i] = attestations[collectionId][raters[i]];
        }
        
        return result;
    }
    
    /**
     * @notice Calculate average rating for a collection
     * @param collectionId Collection identifier
     * @return Average rating (0 if no attestations)
     */
    function getAverageRating(string calldata collectionId) 
        external 
        view 
        returns (uint256) 
    {
        address[] memory raters = collectionRaters[collectionId];
        if (raters.length == 0) return 0;
        
        uint256 totalRating = 0;
        for (uint256 i = 0; i < raters.length; i++) {
            totalRating += attestations[collectionId][raters[i]].rating;
        }
        
        return totalRating / raters.length;
    }
    
    /**
     * @notice Get total number of ratings for a collection
     * @param collectionId Collection identifier
     * @return Number of attestations
     */
    function getRatingCount(string calldata collectionId) external view returns (uint256) {
        return collectionRaters[collectionId].length;
    }
    
    /**
     * @notice Check if a collection exists
     * @param id Collection identifier
     * @return True if exists
     */
    function doesCollectionExist(string calldata id) external view returns (bool) {
        return collectionExists[id];
    }
    
    /**
     * @notice Check if user has attested to a collection
     * @param collectionId Collection identifier
     * @param rater Rater address
     * @return True if user has attested
     */
    function hasUserAttested(string calldata collectionId, address rater) 
        external 
        view 
        returns (bool) 
    {
        return hasAttested[collectionId][rater];
    }
}