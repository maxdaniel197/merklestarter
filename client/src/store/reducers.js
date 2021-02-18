import * as connect from './actions';

const initialState = {
  web3: null,
  address: null,
  loading: false,
  starter: null,
  token: null,
  tranche: 0,
  tranches: [],
  proofs: [],
  balances: [],
  claimableAmount: 0,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case connect.SET_WEB3:
      return {
        ...state,
        web3: action.web3,
      };
    case connect.SET_ADDRESS:
      return {
        ...state,
        address: action.address,
      };
    case connect.SET_LOADING:
      return {
        ...state,
        loading: action.loading,
      };
    case connect.SET_STARTER:
      return {
        ...state,
        starter: action.starter,
      };
    case connect.SET_TOKEN:
      return {
        ...state,
        token: action.token,
      };
    case connect.SET_TRANCHE:
      return {
        ...state,
        tranche: action.tranche,
      };
    case connect.SET_CLAIMABLE_AMOUNT:
      return {
        ...state,
        claimableAmount: action.claimableAmount,
      };
    case connect.SET_TRANCHES:
      return {
        ...state,
        tranches: action.tranches,
      };
    case connect.SET_PROOFS:
      return {
        ...state,
        proofs: action.proofs,
      };
    case connect.SET_BALANCES:
      return {
        ...state,
        balances: action.balances,
      };
    default:
      return state;
  }
};

export default rootReducer;
