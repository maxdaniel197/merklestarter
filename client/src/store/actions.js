export const SET_WEB3 = 'SET_WEB3';
export const setWeb3 = (web3) => async (dispatch) => {
  dispatch({
    type: SET_WEB3,
    web3,
  });
};

export const SET_ADDRESS = 'SET_ADDRESS';
export const setAddress = (address) => (dispatch) => {
  dispatch({
    type: SET_ADDRESS,
    address,
  });
};

export const SET_STARTER = 'SET_STARTER';
export const setStarter = (starter) => async (dispatch) => {
  dispatch({
    type: SET_STARTER,
    starter,
  });
};

export const SET_TOKEN = 'SET_TOKEN';
export const setToken = (token) => async (dispatch) => {
  dispatch({
    type: SET_TOKEN,
    token,
  });
};

export const SET_LOADING = 'SET_LOADING';
export const setLoading = (loading) => (dispatch) => {
  dispatch({
    type: SET_LOADING,
    loading,
  });
};

export const SET_TRANCHE = 'SET_TRANCHE';
export const setTranche = (tranche) => (dispatch) => {
  dispatch({
    type: SET_TRANCHE,
    tranche,
  });
};

export const SET_CLAIMABLE_AMOUNT = 'SET_CLAIMABLE_AMOUNT';
export const setClaimableAmount = (claimableAmount) => (dispatch) => {
  dispatch({
    type: SET_CLAIMABLE_AMOUNT,
    claimableAmount,
  });
};

export const SET_TRANCHES = 'SET_TRANCHES';
export const setTranches = (tranches) => (dispatch) => {
  dispatch({
    type: SET_TRANCHES,
    tranches,
  });
};

export const SET_PROOFS = 'SET_PROOFS';
export const setProofs = (proofs) => (dispatch) => {
  dispatch({
    type: SET_PROOFS,
    proofs,
  });
};

export const SET_BALANCES = 'SET_BALANCES';
export const setBalances = (balances) => (dispatch) => {
  dispatch({
    type: SET_BALANCES,
    balances,
  });
};
