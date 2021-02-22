// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleStarter is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    event Claimed(address claimant, uint256 Month, uint256 balance);
    event TrancheAdded(
        uint256 tranche,
        bytes32 merkleRoot,
        uint256 totalAmount
    );

    uint public rate;

    event TrancheExpired(uint256 tranche);

    IERC20 public token;

    mapping(uint256 => bytes32) public merkleRoots;
    mapping(uint256 => mapping(address => bool)) public claimed;
    uint256 public tranches;

    constructor(IERC20 _token, uint256 _rate) public {
        token = _token;
        rate = _rate;
    }

    function seedNewAllocations(bytes32 _merkleRoot, uint256 _totalAllocation)
        public
        onlyOwner
        returns (uint256 trancheId)
    {
        token.safeTransferFrom(msg.sender, address(this), _totalAllocation);

        trancheId = tranches;
        merkleRoots[trancheId] = _merkleRoot;

        tranches = tranches.add(1);

        emit TrancheAdded(trancheId, _merkleRoot, _totalAllocation);
    }

    function expireTranche(uint256 _trancheId) public onlyOwner {
        merkleRoots[_trancheId] = bytes32(0);

        emit TrancheExpired(_trancheId);
    }

    function claim(
        address user,
        uint256 _tranche,
        uint256 _balance,
        bytes32[] memory _merkleProof
    ) public payable {
        require(msg.value >= _balance * rate);
        _claim(user, _tranche, _balance, _merkleProof);
        _disburse(user, _balance);
    }

    function multiClaim(
        address user,
        uint256[] memory _tranches,
        uint256[] memory _balances,
        bytes32[][] memory _merkleProofs
    ) public {
        uint256 len = _tranches.length;
        require(
            len == _balances.length && len == _merkleProofs.length,
            "Mismatching inputs"
        );

        uint256 totalBalance = 0;
        for (uint256 i = 0; i < len; i++) {
            _claim(user, _tranches[i], _balances[i], _merkleProofs[i]);
            totalBalance = totalBalance.add(_balances[i]);
        }
        _disburse(user, totalBalance);
    }

    function verifyClaim(
        address user,
        uint256 _tranche,
        uint256 _balance,
        bytes32[] memory _merkleProof
    ) public view returns (bool valid) {
        return _verifyClaim(user, _tranche, _balance, _merkleProof);
    }

    function _claim(
        address user,
        uint256 _tranche,
        uint256 _balance,
        bytes32[] memory _merkleProof
    ) private {
        require(_tranche < tranches, "You cannot claim future token");

        require(!claimed[_tranche][user], "you has already claimed");
        require(
            _verifyClaim(user, _tranche, _balance, _merkleProof),
            "Incorrect merkle proof"
        );

        claimed[_tranche][user] = true;

        emit Claimed(user, _tranche, _balance);
    }

    function _verifyClaim(
        address user,
        uint256 _tranche,
        uint256 _balance,
        bytes32[] memory _merkleProof
    ) private view returns (bool valid) {
        bytes32 leaf = keccak256(abi.encodePacked(user, _balance));
        return MerkleProof.verify(_merkleProof, merkleRoots[_tranche], leaf);
    }

    function _disburse(address user, uint256 _balance) private {
        if (_balance > 0) {
            token.safeTransfer(user, _balance);
        } else {
            revert(
                "No balance would be transferred - not going to waste your gas"
            );
        }
    }

    /**
     * @dev function withdraw ETH to account owner
     * @param _amount is amount withdraw
     */
    function withdrawETH(uint256 _amount) external onlyOwner {
        require(_amount > 0, "_amount must be greater than 0");
        require(
            address(this).balance >= _amount,
            "_amount must be less than the ETH balance of the contract"
        );
        msg.sender.transfer(_amount);
    }

    /**
     * @dev function withdraw token to account owner
     * @param _amount is amount withdraw
     */
    function withdrawToken(uint256 _amount) external onlyOwner {
        require(_amount > 0, "_amount must be greater than 0");
        require(
            token.balanceOf(address(this)) >= _amount,
            "The balance is not enough!"
        );
        token.transfer(msg.sender, _amount);
    }

    /**
     * @dev function withdraw ERC20 token to account owner
     * @param _token is address of the token
     * @param _amount is amount withdraw
     */
    function withdrawERC20(address _token, uint256 _amount) external onlyOwner {
        require(_amount > 0, "_amount must be greater than 0");
        require(
            IERC20(_token).balanceOf(address(this)) >= _amount,
            "The balance is not enough!"
        );
        IERC20(_token).transfer(msg.sender, _amount);
    }
}
