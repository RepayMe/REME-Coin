pragma solidity ^0.4.23;


import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";


/**
 * @title RemeCoin
 * @author https://bit-sentinel.com
 */
contract RemeCoin is PausableToken {
  event EnabledFees();
  event DisabledFees();
  event FeeChanged(uint256 fee);
  event FeeThresholdChanged(uint256 feeThreshold);
  event FeeBeneficiaryChanged(address indexed feeBeneficiary);

  string public constant name = "REME Coin"; // solium-disable-line uppercase
  string public constant symbol = "REME"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  uint256 public fee;
  bool public feesEnabled;
  address public feeBeneficiary;
  uint256 public feeThreshold;

  uint256 public constant INITIAL_SUPPLY = 375000000 * (10 ** uint256(decimals)); // solium-disable-line max-len

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   * @param _fee uint256 The fee percentage to be applied. Has 4 decimals.
   * @param _feeBeneficiary address The beneficiary of the fees.
   * @param _feeThreshold uint256 The amount of when the transfers fees will be applied.
   */
  constructor (
    uint256 _fee,
    address _feeBeneficiary,
    uint256 _feeThreshold
  )
    public
  {
    require(_fee != uint256(0) && _fee <= uint256(100 * (10 ** 4)));
    require(_feeBeneficiary != address(0));
    require(_feeThreshold != uint256(0));

    fee = _fee;
    feeBeneficiary = _feeBeneficiary;
    feeThreshold = _feeThreshold;

    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }

  /**
   * @dev Modifier to make a function callable only when the contract has transfer fees enabled.
   */
  modifier whenFeesEnabled() {
    require(feesEnabled);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract has transfer fees disabled.
   */
  modifier whenFeesDisabled() {
    require(!feesEnabled);
    _;
  }

  /**
   * @dev Called by owner to enable fee take
   */
  function enableFees()
    public
    onlyOwner
    whenFeesDisabled
  {
    feesEnabled = true;
    emit EnabledFees();
  }

  /**
   * @dev Called by owner to disable fee take
   */
  function disableFees()
    public
    onlyOwner
    whenFeesEnabled
  {
    feesEnabled = false;
    emit DisabledFees();
  }

  /**
   * @dev Called by owner to set fee percentage.
   * @param _fee uint256 The new fee percentage.
   */
  function setFee(uint256 _fee)
    public
    onlyOwner
  {
    require(_fee != uint256(0) && _fee <= 100 * (10 ** 4));
    fee = _fee;
    emit FeeChanged(fee);
  }

  /**
   * @dev Called by owner to set fee beeneficiary.
   * @param _feeBeneficiary address The new fee beneficiary.
   */
  function setFeeBeneficiary(address _feeBeneficiary)
    public
    onlyOwner
  {
    require(_feeBeneficiary != address(0));
    feeBeneficiary = _feeBeneficiary;
    emit FeeBeneficiaryChanged(feeBeneficiary);
  }

  /**
   * @dev Called by owner to set fee threshold.
   * @param _feeThreshold uint256 The new fee threshold.
   */
  function setFeeThreshold(uint256 _feeThreshold)
    public
    onlyOwner
  {
    require(_feeThreshold != uint256(0));
    feeThreshold = _feeThreshold;
    emit FeeThresholdChanged(feeThreshold);
  }

  /**
  * @dev transfer token for a specified address
  * @param _to address The address to transfer to.
  * @param _value uint256 The amount to be transferred.
  */
  function transfer(
    address _to,
    uint256 _value
  )
    public
    returns (bool)
  {
    uint256 _feeTaken;

    if (msg.sender != owner && msg.sender != feeBeneficiary) {
      (_feeTaken, _value) = applyFees(_value);
    }

    if (_feeTaken > 0) {
      require (super.transfer(feeBeneficiary, _feeTaken) && super.transfer(_to, _value));

      return true;
    }

    return super.transfer(_to, _value);
  }

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  )
    public
    returns (bool)
  {
    uint256 _feeTaken;
    (_feeTaken, _value) = applyFees(_value);
    
    if (_feeTaken > 0) {
      require (super.transferFrom(_from, feeBeneficiary, _feeTaken) && super.transferFrom(_from, _to, _value));
      return true;
    }

    return super.transferFrom(_from, _to, _value);
  }

  /**
   * @dev Called internally for applying fees to the transfer value.
   * @param _value uint256
   */
  function applyFees(uint256 _value)
    internal
    view
    returns (uint256 _feeTaken, uint256 _revisedValue)
  {
    _revisedValue = _value;
    if (feesEnabled && _revisedValue >= feeThreshold) {
      _feeTaken = _revisedValue.mul(fee).div(uint256(100 * (10 ** 4)));
      _revisedValue = _revisedValue.sub(_feeTaken);
    }
  }
}
