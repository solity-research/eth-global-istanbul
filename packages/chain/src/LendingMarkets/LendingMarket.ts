import {
    RuntimeModule,
    runtimeModule,
    state,
    runtimeMethod,
  } from "@proto-kit/module";
  import { State, StateMap, assert } from "@proto-kit/protocol";
  import { Bool, PublicKey, UInt64 } from "o1js";
import { ERC20LikeToken } from "../tokens/ERC20LikeToken";
import { inject } from "tsyringe";
import { ZKMToken } from "../tokens/zkMToken";
import { ZKMDebtToken } from "../tokens/zkMDebtToken";
export const errors = {
  tokenDoesNotExist: () => "Token does not exists",
  tokensMatch: () => "Cannot create pool with matching tokens",
  tokenOutAmountTooLow: () => "Token amount too low",
  tokenInAmountTooHigh: () => "Token amount too high",
};
@runtimeModule()
export class LendingMarket extends RuntimeModule<unknown> {

  @state() public mSupplyToken = StateMap.from<PublicKey, UInt64>(
    PublicKey,
    UInt64
  );
  public constructor(@inject("zkMToken") public  zkmTokenMap: Map<PublicKey, ZKMToken>,@inject("zkMDebtToken") public  zkmDebtTokenMap: Map<PublicKey, ZKMDebtToken>,@inject("ERC20LikeToken") public  tokenMap: Map<PublicKey, ERC20LikeToken>) {
    super();
  }
  public assertTokenExist(asset:PublicKey) {
    
    assert(this.tokenExist(asset), errors.tokenDoesNotExist());
  }
  public assertZKMTokenExist(asset:PublicKey) {
    
    assert(this.ZKMTokenExist(asset), errors.tokenDoesNotExist());
  }
  public assertBalanceSufficient( userBalance:UInt64, amount:UInt64) {
    const isTokenOutAmountSufficient =
    userBalance.greaterThanOrEqual(amount);
    assert(isTokenOutAmountSufficient, errors.tokenOutAmountTooLow());

  }
  public tokenExist(asset: PublicKey) {
    const pool = this.tokenMap.get(asset);

    if(pool === undefined)
      return Bool(false);
    else
      return Bool(true);
  }
  public ZKMTokenExist(asset: PublicKey) {
    const pool = this.zkmTokenMap.get(asset);

    if(pool === undefined)
      return Bool(false);
    else
      return Bool(true);
  }
  @runtimeMethod()
  public supply(asset: PublicKey, user: PublicKey, amount: UInt64): void {
    this.assertTokenExist(asset);
    const token = this.tokenMap.get(asset);
    if(token === undefined)
      return;
    const balance = token.balanceOf(user)
    this.assertBalanceSufficient(balance, amount);
    this.assertZKMTokenExist(asset);

    const zkmToken = this.zkmTokenMap.get(asset)
    if(zkmToken === undefined)
      return;
    const mTokenAddress = zkmToken.getAddress();
    token.transfer(user,mTokenAddress, amount);
    zkmToken._supply(user, amount);

  }

  @runtimeMethod()
  public withdraw(asset: PublicKey, user: PublicKey, amount: UInt64): void {}
  
  @runtimeMethod()
  public borrow(asset: PublicKey, user: PublicKey, amount: UInt64): void {}
  
  @runtimeMethod()
  public repay(asset: PublicKey, user: PublicKey, amount: UInt64): void {}
}