// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BaibelRegistry} from "../src/BaibelRegistry.sol";

contract BaibelRegistryTest is Test {
    BaibelRegistry public registry;
    
    address public author = address(1);
    address public rater1 = address(2);
    address public rater2 = address(3);
    address public rater3 = address(4);
    
    // Define events for testing
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
    
    function setUp() public {
        registry = new BaibelRegistry();
    }
    
    // ============ Registration Tests ============
    
    function test_RegisterCollection() public {
        vm.prank(author);
        
        vm.expectEmit(true, true, false, true);
        emit CollectionRegistered(
            "col-1",
            "Test Collection",
            author,
            "1.0.0",
            100,
            "QmTest123",
            block.timestamp
        );
        
        registry.registerCollection(
            "col-1",
            "Test Collection",
            "1.0.0",
            100,
            "QmTest123"
        );
        
        // Verify collection exists
        assertTrue(registry.doesCollectionExist("col-1"));
        
        // Verify collection data
        BaibelRegistry.Collection memory col = registry.getCollection("col-1");
        assertEq(col.id, "col-1");
        assertEq(col.name, "Test Collection");
        assertEq(col.author, author);
        assertEq(col.version, "1.0.0");
        assertEq(col.docCount, 100);
        assertEq(col.ipfsHash, "QmTest123");
        assertEq(col.createdAt, block.timestamp);
        assertEq(col.updatedAt, block.timestamp);
    }
    
    function test_RegisterCollection_RevertIf_EmptyId() public {
        vm.prank(author);
        vm.expectRevert(BaibelRegistry.EmptyCollectionId.selector);
        registry.registerCollection("", "Name", "1.0", 10, "QmTest");
    }
    
    function test_RegisterCollection_RevertIf_EmptyName() public {
        vm.prank(author);
        vm.expectRevert(BaibelRegistry.EmptyName.selector);
        registry.registerCollection("col-1", "", "1.0", 10, "QmTest");
    }
    
    function test_RegisterCollection_RevertIf_EmptyIpfsHash() public {
        vm.prank(author);
        vm.expectRevert(BaibelRegistry.EmptyIpfsHash.selector);
        registry.registerCollection("col-1", "Name", "1.0", 10, "");
    }
    
    function test_RegisterCollection_RevertIf_AlreadyExists() public {
        vm.startPrank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.expectRevert(BaibelRegistry.CollectionAlreadyExists.selector);
        registry.registerCollection("col-1", "Name2", "1.1", 20, "QmTest2");
        vm.stopPrank();
    }
    
    function test_MultipleAuthors_RegisterCollections() public {
        address author2 = address(5);
        
        vm.prank(author);
        registry.registerCollection("col-1", "Collection 1", "1.0", 10, "QmTest1");
        
        vm.prank(author2);
        registry.registerCollection("col-2", "Collection 2", "1.0", 20, "QmTest2");
        
        assertEq(registry.getCollectionsByAuthor(author).length, 1);
        assertEq(registry.getCollectionsByAuthor(author2).length, 1);
    }
    
    // ============ Update Tests ============
    
    function test_UpdateCollection() public {
        vm.startPrank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.warp(block.timestamp + 1);
        
        vm.expectEmit(true, false, false, true);
        emit CollectionUpdated(
            "col-1",
            "Updated Name",
            "1.1",
            20,
            "QmUpdated",
            block.timestamp
        );
        
        registry.updateCollection("col-1", "Updated Name", "1.1", 20, "QmUpdated");
        
        BaibelRegistry.Collection memory col = registry.getCollection("col-1");
        assertEq(col.name, "Updated Name");
        assertEq(col.version, "1.1");
        assertEq(col.docCount, 20);
        assertEq(col.ipfsHash, "QmUpdated");
        assertEq(col.updatedAt, block.timestamp);
        vm.stopPrank();
    }
    
    function test_UpdateCollection_RevertIf_NotAuthor() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(rater1);
        vm.expectRevert(BaibelRegistry.NotCollectionAuthor.selector);
        registry.updateCollection("col-1", "Hacked", "2.0", 999, "QmHack");
    }
    
    function test_UpdateCollection_RevertIf_NotFound() public {
        vm.prank(author);
        vm.expectRevert(BaibelRegistry.CollectionNotFound.selector);
        registry.updateCollection("nonexistent", "Name", "1.0", 10, "QmTest");
    }
    
    function test_UpdateCollection_RevertIf_EmptyName() public {
        vm.startPrank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.expectRevert(BaibelRegistry.EmptyName.selector);
        registry.updateCollection("col-1", "", "1.0", 10, "QmTest");
        vm.stopPrank();
    }
    
    // ============ Attestation Tests ============
    
    function test_SubmitAttestation() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(rater1);
        vm.expectEmit(true, true, false, true);
        emit AttestationSubmitted(
            "col-1",
            rater1,
            5,
            "Great collection!",
            block.timestamp
        );
        
        registry.submitAttestation("col-1", 5, "Great collection!");
        
        // Verify attestation
        BaibelRegistry.Attestation memory att = registry.getAttestation("col-1", rater1);
        assertEq(att.rater, rater1);
        assertEq(att.rating, 5);
        assertEq(att.review, "Great collection!");
        assertEq(att.timestamp, block.timestamp);
        
        // Verify user has attested
        assertTrue(registry.hasUserAttested("col-1", rater1));
        
        // Verify rating count
        assertEq(registry.getRatingCount("col-1"), 1);
    }
    
    function test_SubmitAttestation_UpdateExisting() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(rater1);
        registry.submitAttestation("col-1", 3, "Okay");
        
        vm.warp(block.timestamp + 1);
        
        // Update with new rating
        vm.prank(rater1);
        registry.submitAttestation("col-1", 5, "Actually great!");
        
        BaibelRegistry.Attestation memory att = registry.getAttestation("col-1", rater1);
        assertEq(att.rating, 5);
        assertEq(att.review, "Actually great!");
        
        // Rating count should still be 1 (not 2)
        assertEq(registry.getRatingCount("col-1"), 1);
    }
    
    function test_SubmitAttestation_MultipleRaters() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(rater1);
        registry.submitAttestation("col-1", 5, "Excellent");
        
        vm.prank(rater2);
        registry.submitAttestation("col-1", 4, "Good");
        
        vm.prank(rater3);
        registry.submitAttestation("col-1", 3, "Okay");
        
        assertEq(registry.getRatingCount("col-1"), 3);
        assertEq(registry.getAverageRating("col-1"), 4); // (5+4+3)/3 = 4
        
        BaibelRegistry.Attestation[] memory atts = registry.getAttestations("col-1");
        assertEq(atts.length, 3);
    }
    
    function test_SubmitAttestation_RevertIf_SelfRating() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(author);
        vm.expectRevert(BaibelRegistry.SelfRatingNotAllowed.selector);
        registry.submitAttestation("col-1", 5, "I'm awesome");
    }
    
    function test_SubmitAttestation_RevertIf_InvalidRating() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(rater1);
        vm.expectRevert(BaibelRegistry.InvalidRating.selector);
        registry.submitAttestation("col-1", 0, "Invalid");
        
        vm.prank(rater1);
        vm.expectRevert(BaibelRegistry.InvalidRating.selector);
        registry.submitAttestation("col-1", 6, "Invalid");
    }
    
    function test_SubmitAttestation_RevertIf_CollectionNotFound() public {
        vm.prank(rater1);
        vm.expectRevert(BaibelRegistry.CollectionNotFound.selector);
        registry.submitAttestation("nonexistent", 5, "Review");
    }
    
    // ============ View Function Tests ============
    
    function test_GetCollectionsByAuthor() public {
        vm.startPrank(author);
        registry.registerCollection("col-1", "Name 1", "1.0", 10, "Qm1");
        registry.registerCollection("col-2", "Name 2", "1.0", 20, "Qm2");
        registry.registerCollection("col-3", "Name 3", "1.0", 30, "Qm3");
        vm.stopPrank();
        
        string[] memory collections = registry.getCollectionsByAuthor(author);
        assertEq(collections.length, 3);
        assertEq(collections[0], "col-1");
        assertEq(collections[1], "col-2");
        assertEq(collections[2], "col-3");
    }
    
    function test_GetAverageRating_NoRatings() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        assertEq(registry.getAverageRating("col-1"), 0);
    }
    
    function test_GetAverageRating_Rounding() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        // Ratings: 5 + 4 = 9, 9/2 = 4.5, rounds to 4
        vm.prank(rater1);
        registry.submitAttestation("col-1", 5, "Great");
        
        vm.prank(rater2);
        registry.submitAttestation("col-1", 4, "Good");
        
        assertEq(registry.getAverageRating("col-1"), 4); // 9/2 = 4.5, truncates to 4
    }
    
    function test_GetAttestations() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(rater1);
        registry.submitAttestation("col-1", 5, "Review 1");
        
        vm.prank(rater2);
        registry.submitAttestation("col-1", 4, "Review 2");
        
        BaibelRegistry.Attestation[] memory atts = registry.getAttestations("col-1");
        assertEq(atts.length, 2);
        
        // Check rater1's attestation
        assertEq(atts[0].rater, rater1);
        assertEq(atts[0].rating, 5);
        assertEq(atts[0].review, "Review 1");
        
        // Check rater2's attestation
        assertEq(atts[1].rater, rater2);
        assertEq(atts[1].rating, 4);
        assertEq(atts[1].review, "Review 2");
    }
    
    function test_GetCollection_RevertIf_NotFound() public {
        vm.expectRevert(BaibelRegistry.CollectionNotFound.selector);
        registry.getCollection("nonexistent");
    }
    
    // ============ Edge Cases ============
    
    function test_EmptyReviewAllowed() public {
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(rater1);
        registry.submitAttestation("col-1", 4, ""); // Empty review is valid
        
        BaibelRegistry.Attestation memory att = registry.getAttestation("col-1", rater1);
        assertEq(att.review, "");
    }
    
    function test_Fuzz_ValidRatings(uint8 rating) public {
        vm.assume(rating >= 1 && rating <= 5);
        
        vm.prank(author);
        registry.registerCollection("col-1", "Name", "1.0", 10, "QmTest");
        
        vm.prank(rater1);
        registry.submitAttestation("col-1", rating, "Review");
        
        BaibelRegistry.Attestation memory att = registry.getAttestation("col-1", rater1);
        assertEq(att.rating, rating);
    }
}