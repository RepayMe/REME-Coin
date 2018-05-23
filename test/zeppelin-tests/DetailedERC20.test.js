const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const DetailedERC20 = artifacts.require('RemeCoin');

contract('DetailedERC20', function ([_, owner, feeBeneficiary]) {
  let detailedERC20 = null;

  const FEE = new BigNumber(5000); // 0.5%
  const FEE_THRESHOLD = new BigNumber(web3.toWei(500, 'ether'));

  const _name = 'REME Coin';
  const _symbol = 'REME';
  const _decimals = 18;

  beforeEach(async function () {
    detailedERC20 = await DetailedERC20.new(FEE, feeBeneficiary, FEE_THRESHOLD, { from: owner });
  });

  it('has a name', async function () {
    const name = await detailedERC20.name();
    name.should.be.equal(_name);
  });

  it('has a symbol', async function () {
    const symbol = await detailedERC20.symbol();
    symbol.should.be.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    const decimals = await detailedERC20.decimals();
    decimals.should.be.bignumber.equal(_decimals);
  });
});
