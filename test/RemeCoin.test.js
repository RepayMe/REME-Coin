import assertRevert from 'zeppelin-solidity/test/helpers/assertRevert';

const BigNumber = web3.BigNumber;
const RemeCoin = artifacts.require('RemeCoin');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('RemeCoin', function ([_, owner, recipient, anotherAccount, FEE_BENEFICIARY, NEW_FEE_BENEFICIARY]) {
  const FEE = new BigNumber(5000); // 0.5%
  const FEE_THRESHOLD = new BigNumber(web3.toWei(500, 'ether'));
  const TOTAL_SUPPLY = new BigNumber(web3.toWei(375000000, 'ether'));
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('constructor', function () {
    describe('when given parameters are valid', function () {
      beforeEach(async function () {
        this.token = await RemeCoin.new(FEE, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner });
      });

      it('sets fee', async function () {
        const fee = await this.token.fee();

        fee.should.be.bignumber.equal(FEE);
      });

      it('sets feeBeneficiary', async function () {
        const feeBeneficiary = await this.token.feeBeneficiary();

        assert.equal(feeBeneficiary, FEE_BENEFICIARY);
      });
      
      it('sets feeThreshold', async function () {
        const feeThreshold = await this.token.feeThreshold();

        feeThreshold.should.be.bignumber.equal(FEE_THRESHOLD);
      });

      it('defaults feesEnabled to false', async function () {
        const feesEnabled = await this.token.feesEnabled();

        assert.isFalse(feesEnabled);
      });
    });

    describe('when the given parameters are invalid', function () {
      describe('when the fee is 0', function () {
        it('reverts', async function () {
          await assertRevert(RemeCoin.new(0, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner }));
        });
      });

      describe('when the fee is greater than 100%', function () {
        it('reverts', async function () {
          await assertRevert(RemeCoin.new(1000001, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner }));
        });
      });

      describe('when the feeBeneficiary is the zero address', function () {
        it('reverts', async function () {
          await assertRevert(RemeCoin.new(FEE, ZERO_ADDRESS, FEE_THRESHOLD, { from: owner }));
        });
      });

      describe('when the feeThreshold is 0', function () {
        it('reverts', async function () {
          await assertRevert(RemeCoin.new(FEE, FEE_BENEFICIARY, 0, { from: owner }));
        });
      });
    });
  });

  describe('enableFees', function () {
    beforeEach(async function () {
      this.token = await RemeCoin.new(FEE, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner });
    });

    describe('when the sender is the token owner', function () {
      const from = owner;

      describe('when the fees are disabled', function () {
        it('enables fees', async function () {
          await this.token.enableFees({ from });

          const feesEnabled = await this.token.feesEnabled();
          assert.equal(feesEnabled, true);
        });

        it('emits a EnabledFees event', async function () {
          const { logs } = await this.token.enableFees({ from });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'EnabledFees');
        });
      });

      describe('when the fees are enabled', function () {
        beforeEach(async function () {
          await this.token.enableFees({ from });
        });

        it('reverts', async function () {
          await assertRevert(this.token.enableFees({ from }));
        });
      });

      describe('when the sender is not the token owner', function () {
        const from = anotherAccount;

        it('reverts', async function () {
          await assertRevert(this.token.enableFees({ from }));
        });
      });
    });
  });

  describe('disableFees', function () {
    beforeEach(async function () {
      this.token = await RemeCoin.new(FEE, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner });
    });

    describe('when the sender is the token owner', function () {
      const from = owner;

      describe('when the fees are enabled', function () {
        beforeEach(async function () {
          await this.token.enableFees({ from });
        });

        it('disable fees', async function () {
          await this.token.disableFees({ from });

          const feesEnabled = await this.token.feesEnabled();
          assert.equal(feesEnabled, false);
        });

        it('emits a DisabledFees event', async function () {
          const { logs } = await this.token.disableFees({ from });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'DisabledFees');
        });
      });

      describe('when the fees are disabled', function () {
        it('reverts', async function () {
          await assertRevert(this.token.disableFees({ from }));
        });
      });
      
      describe('when the sender is not the token owner', function () {
        const from = anotherAccount;

        it('reverts', async function () {
          await assertRevert(this.token.disableFees({ from }));
        });
      });
    });
  });

  describe('setFee', function () {
    beforeEach(async function () {
      this.token = await RemeCoin.new(FEE, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner });
    });

    describe('when the sender is the token owner', function () {
      const from = owner;

      describe('when the given fee is valid', function () {
        const newFee = new BigNumber(10000); // 1%

        it('updates fee', async function () {
          await this.token.setFee(newFee, { from });

          const fee = await this.token.fee();

          fee.should.be.bignumber.equal(newFee);
        });

        it('emits a FeeChanged event', async function () {
          const { logs } = await this.token.setFee(newFee, { from });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'FeeChanged');
          logs[0].args.fee.should.be.bignumber.equal(newFee);
        });
      });

      describe('when the given fee is invalid', function () {
        describe('when fee is 0', function () {
          it('reverts', async function () {
            await assertRevert(this.token.setFee(0, { from }));
          });
        });

        describe('when fee is greater than 100%', function () {
          it('reverts', async function () {
            await assertRevert(this.token.setFee(1000001, { from }));
          });
        });
      });
    });

    describe('when the sender is not the token owner', function () {
      const from = anotherAccount;
      const newFee = new BigNumber(10000); // 1%

      it('reverts', async function () {
        await assertRevert(this.token.setFee(newFee, { from }));
      });
    });
  });

  describe('setFeeBeneficiary', function () {
    beforeEach(async function () {
      this.token = await RemeCoin.new(FEE, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner });
    });

    describe('when the sender is the token owner', function () {
      const from = owner;

      describe('when the given feeBeneficiary is valid', function () {
        const newFeeBeneficiary = NEW_FEE_BENEFICIARY;

        it('updates fee', async function () {
          await this.token.setFeeBeneficiary(newFeeBeneficiary, { from });

          const feeBeneficiary = await this.token.feeBeneficiary();

          assert.equal(feeBeneficiary, newFeeBeneficiary);
        });

        it('emits a FeeBeneficiaryChanged event', async function () {
          const { logs } = await this.token.setFeeBeneficiary(newFeeBeneficiary, { from });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'FeeBeneficiaryChanged');
          assert.equal(logs[0].args.feeBeneficiary, newFeeBeneficiary);
        });
      });

      describe('when the given feeBeneficiary is invalid', function () {
        it('reverts', async function () {
          await assertRevert(this.token.setFeeBeneficiary(ZERO_ADDRESS, { from }));
        });
      });
    });

    describe('when the sender is not the token owner', function () {
      const from = anotherAccount;
      const newFeeBeneficiary = NEW_FEE_BENEFICIARY;

      it('reverts', async function () {
        await assertRevert(this.token.setFeeBeneficiary(newFeeBeneficiary, { from }));
      });
    });
  });

  describe('setFeeThreshold', function () {
    beforeEach(async function () {
      this.token = await RemeCoin.new(FEE, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner });
    });

    describe('when the sender is the token owner', function () {
      const from = owner;

      describe('when the given feeThreshold is valid', function () {
        const newFeeThreshold = new BigNumber(web3.toWei(10000, 'ether'));

        it('updates feeThreshold', async function () {
          await this.token.setFeeThreshold(newFeeThreshold, { from });

          const feeThreshold = await this.token.feeThreshold();

          feeThreshold.should.be.bignumber.equal(newFeeThreshold);
        });

        it('emits a FeeThresholdChanged event', async function () {
          const { logs } = await this.token.setFeeThreshold(newFeeThreshold, { from });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'FeeThresholdChanged');
          logs[0].args.feeThreshold.should.be.bignumber.equal(newFeeThreshold);
        });
      });

      describe('when the given feeThreshold is invalid', function () {
        it('reverts', async function () {
          await assertRevert(this.token.setFeeThreshold(0, { from }));
        });
      });
    });

    describe('when the sender is not the token owner', function () {
      const from = anotherAccount;
      const newFeeThreshold = new BigNumber(web3.toWei(10000, 'ether'));

      it('reverts', async function () {
        await assertRevert(this.token.setFeeThreshold(newFeeThreshold, { from }));
      });
    });
  });

  describe('transfer w/ fees enabled', function () {
    beforeEach(async function () {
      this.token = await RemeCoin.new(FEE, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner });
      await this.token.enableFees({ from: owner });
    });

    describe('when the transfered amount is under feeThreshold', function () {
      const amount = FEE_THRESHOLD.sub(1);

      describe('when the recipient is not the zero address', function () {
        const to = recipient;

        describe('when the sender does not have enough balance', function () {
          it('reverts', async function () {
            await assertRevert(this.token.transfer(to, amount, { from: anotherAccount }));
          });
        });

        describe('when the sender has enough balance', function () {
          it('transfers the requested amount', async function () {
            await this.token.transfer(to, amount, { from: owner });

            const senderBalance = await this.token.balanceOf(owner);
            senderBalance.should.be.bignumber.equal(TOTAL_SUPPLY.sub(amount));

            const recipientBalance = await this.token.balanceOf(to);
            recipientBalance.should.be.bignumber.equal(amount);
          });

          it('emits a transfer event', async function () {
            const { logs } = await this.token.transfer(to, amount, { from: owner });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Transfer');
            assert.equal(logs[0].args.from, owner);
            assert.equal(logs[0].args.to, to);
            logs[0].args.value.should.be.bignumber.equal(amount);
          });
        });
      });

      describe('when the recipient is the zero address', function () {
        const to = ZERO_ADDRESS;

        it('reverts', async function () {
          await assertRevert(this.token.transfer(to, amount, { from: owner }));
        });
      });
    });

    describe('when the transfered amount is over feeThreshold', function () {
      const amount = FEE_THRESHOLD.mul(2);
      const feeTaken = amount.mul(FEE).divToInt(1000000);
      const transferedAmount = amount.sub(feeTaken);

      describe('when the recipient is not the zero address', function () {
        const to = recipient;

        describe('when the sender is the owner', function () {
          it('doesnt take fees', async function () {
            await this.token.transfer(to, amount, { from: owner });

            const senderBalance = await this.token.balanceOf(owner);
            senderBalance.should.be.bignumber.equal(TOTAL_SUPPLY.sub(amount));

            const recipientBalance = await this.token.balanceOf(to);
            recipientBalance.should.be.bignumber.equal(amount);
          });

          it('emits a transfer event', async function () {
            const { logs } = await this.token.transfer(to, amount, { from: owner });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Transfer');
            assert.equal(logs[0].args.from, owner);
            assert.equal(logs[0].args.to, to);
            logs[0].args.value.should.be.bignumber.equal(amount);
          });
        });

        describe('when the sender does not have enough balance', function () {
          it('reverts', async function () {
            await assertRevert(this.token.transfer(to, amount, { from: anotherAccount }));
          });
        });

        describe('when the sender has only balance for the fee', function () {
          it('reverts', async function () {
            await this.token.transfer(anotherAccount, feeTaken, { from: owner });

            const senderBalance = await this.token.balanceOf(anotherAccount);
            senderBalance.should.be.bignumber.equal(feeTaken);

            await assertRevert(this.token.transfer(to, amount, { from: anotherAccount }));
          });
        });

        describe('when the sender has only balance for the transferedAmount', function () {
          it('reverts', async function () {
            await this.token.transfer(anotherAccount, transferedAmount, { from: owner });

            const senderBalance = await this.token.balanceOf(anotherAccount);
            senderBalance.should.be.bignumber.equal(transferedAmount);

            await assertRevert(this.token.transfer(to, amount, { from: anotherAccount }));
          });
        });

        describe('when the sender has enough balance', function () {
          const sender = anotherAccount;

          beforeEach(async function () {
            await this.token.transfer(sender, amount, { from: owner });
          });

          it('transfers the requested amount', async function () {
            await this.token.transfer(to, amount, { from: sender });

            const senderBalance = await this.token.balanceOf(sender);
            senderBalance.should.be.bignumber.equal(0);

            const feeBeneficiaryBalance = await this.token.balanceOf(FEE_BENEFICIARY);
            feeBeneficiaryBalance.should.be.bignumber.equal(feeTaken);

            const recipientBalance = await this.token.balanceOf(to);
            recipientBalance.should.be.bignumber.equal(transferedAmount);
          });

          it('emits two transfer event', async function () {
            const { logs } = await this.token.transfer(to, amount, { from: sender });

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, 'Transfer');
            assert.equal(logs[0].args.from, sender);
            assert.equal(logs[0].args.to, FEE_BENEFICIARY);
            logs[0].args.value.should.be.bignumber.equal(feeTaken);

            assert.equal(logs[1].event, 'Transfer');
            assert.equal(logs[1].args.from, sender);
            assert.equal(logs[1].args.to, to);
            logs[1].args.value.should.be.bignumber.equal(transferedAmount);
          });
        });
      });

      describe('when the recipient is the zero address', function () {
        const to = ZERO_ADDRESS;

        it('reverts', async function () {
          await assertRevert(this.token.transfer(to, amount, { from: owner }));
        });
      });
    });
  });

  describe('transfer from w/ fees enabled', function () {
    beforeEach(async function () {
      this.token = await RemeCoin.new(FEE, FEE_BENEFICIARY, FEE_THRESHOLD, { from: owner });
      await this.token.enableFees({ from: owner });
    });

    const spender = recipient;

    describe('when the transfered amount is under feeThreshold', function () {
      describe('when the recipient is not the zero address', function () {
        const amount = FEE_THRESHOLD.sub(1);
        const to = anotherAccount;

        describe('when the spender has enough approved balance', function () {
          beforeEach(async function () {
            await this.token.approve(spender, amount, { from: owner });
          });

          describe('when the owner has enough balance', function () {
            it('transfers the requested amount', async function () {
              await this.token.transferFrom(owner, to, amount, { from: spender });

              const senderBalance = await this.token.balanceOf(owner);
              senderBalance.should.be.bignumber.equal(TOTAL_SUPPLY.sub(amount));

              const recipientBalance = await this.token.balanceOf(to);
              recipientBalance.should.be.bignumber.equal(amount);
            });

            it('decreases the spender allowance', async function () {
              await this.token.transferFrom(owner, to, amount, { from: spender });

              const allowance = await this.token.allowance(owner, spender);
              assert(allowance.eq(0));
            });

            it('emits a transfer event', async function () {
              const { logs } = await this.token.transferFrom(owner, to, amount, { from: spender });

              assert.equal(logs.length, 1);
              assert.equal(logs[0].event, 'Transfer');
              assert.equal(logs[0].args.from, owner);
              assert.equal(logs[0].args.to, to);
              assert(logs[0].args.value.eq(amount));
            });
          });

          describe('when the owner does not have enough balance', function () {
            it('reverts', async function () {
              await this.token.transfer(anotherAccount, TOTAL_SUPPLY.sub(amount).add(1), { from: owner });
              await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
            });
          });
        });

        describe('when the spender does not have enough approved balance', function () {
          beforeEach(async function () {
            await this.token.approve(spender, amount.sub(1), { from: owner });
          });

          describe('when the owner has enough balance', function () {
            it('reverts', async function () {
              await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
            });
          });

          describe('when the owner does not have enough balance', function () {
            it('reverts', async function () {
              await this.token.transfer(anotherAccount, TOTAL_SUPPLY.sub(amount).add(1), { from: owner });
              await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
            });
          });
        });
      });

      describe('when the recipient is the zero address', function () {
        const to = ZERO_ADDRESS;
        const amount = FEE_THRESHOLD.sub(1);

        beforeEach(async function () {
          await this.token.approve(spender, amount, { from: owner });
        });

        it('reverts', async function () {
          await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
        });
      });
    });

    describe('when the transfered amount is over feeThreshold', function () {
      describe('when the recipient is not the zero address', function () {
        const amount = FEE_THRESHOLD.mul(2);
        const feeTaken = amount.mul(FEE).divToInt(1000000);
        const transferedAmount = amount.sub(feeTaken);
        const to = anotherAccount;

        describe('when the spender has enough approved balance', function () {
          beforeEach(async function () {
            await this.token.approve(spender, amount, { from: owner });
          });

          describe('when the owner has enough balance', function () {
            it('transfers the requested amount', async function () {
              await this.token.transferFrom(owner, to, amount, { from: spender });

              const senderBalance = await this.token.balanceOf(owner);
              senderBalance.should.be.bignumber.equal(TOTAL_SUPPLY.sub(amount));

              const feeBeneficiaryBalance = await this.token.balanceOf(FEE_BENEFICIARY);
              feeBeneficiaryBalance.should.be.bignumber.equal(feeTaken);

              const recipientBalance = await this.token.balanceOf(to);
              recipientBalance.should.be.bignumber.equal(transferedAmount);
            });

            it('decreases the spender allowance', async function () {
              await this.token.transferFrom(owner, to, amount, { from: spender });

              const allowance = await this.token.allowance(owner, spender);
              assert(allowance.eq(0));
            });

            it('emits two transfer events', async function () {
              const { logs } = await this.token.transferFrom(owner, to, amount, { from: spender });

              assert.equal(logs.length, 2);

              assert.equal(logs[0].event, 'Transfer');
              assert.equal(logs[0].args.from, owner);
              assert.equal(logs[0].args.to, FEE_BENEFICIARY);
              logs[0].args.value.should.be.bignumber.equal(feeTaken);

              assert.equal(logs[1].event, 'Transfer');
              assert.equal(logs[1].args.from, owner);
              assert.equal(logs[1].args.to, to);
              logs[1].args.value.should.be.bignumber.equal(transferedAmount);
            });
          });

          describe('when the owner does not have enough balance', function () {
            it('reverts', async function () {
              await this.token.transfer(anotherAccount, TOTAL_SUPPLY.sub(amount).add(1), { from: owner });
              await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
            });
          });
        });

        describe('when the spender does not have enough approved balance', function () {
          beforeEach(async function () {
            await this.token.approve(spender, amount.sub(1), { from: owner });
          });

          describe('when the owner has enough balance', function () {
            it('reverts', async function () {
              await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
            });
          });

          describe('when the owner does not have enough balance', function () {
            it('reverts', async function () {
              await this.token.transfer(anotherAccount, TOTAL_SUPPLY.sub(amount).add(1), { from: owner });
              await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
            });
          });
        });
      });

      describe('when the recipient is the zero address', function () {
        const to = ZERO_ADDRESS;
        const amount = FEE_THRESHOLD.sub(1);

        beforeEach(async function () {
          await this.token.approve(spender, amount, { from: owner });
        });

        it('reverts', async function () {
          await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
        });
      });
    });
  });
});
