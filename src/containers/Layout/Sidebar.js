import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { compose } from 'recompose';
import { NavLink, withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { Select, Icon } from 'antd';
import BigNumber from 'bignumber.js';
import {
  getTokenContract,
  getVbepContract,
  getComptrollerContract,
  getVaiTokenContract,
  methods
} from 'utilities/ContractService';
import { promisify } from 'utilities';
import * as constants from 'utilities/constants';
import ConnectModal from 'components/Basic/ConnectModal';
import { Label } from 'components/Basic/Label';
import Button from '@material-ui/core/Button';
import { connectAccount, accountActionCreators } from 'core';
import MetaMaskClass from 'utilities/MetaMask';
import logoImg from 'assets/img/logo.png';
import commaNumber from 'comma-number';
import { checkIsValidNetwork, getBigNumber } from 'utilities/common';
import toast from 'components/Basic/Toast';
import XVSIcon from 'assets/img/venus.svg';
import XVSActiveIcon from 'assets/img/venus_active.svg';

const SidebarWrapper = styled.div`
  height: 100vh;
  min-width: 108px;
  border-radius: 25px;
  background-color: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  margin-right: 30px;

  @media only screen and (max-width: 768px) {
    display: flex;
    height: 60px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-right: 0px;
  }
`;

const Logo = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 54px;
  i {
    font-size: 18px;
  }

  @media only screen and (max-width: 768px) {
    padding: 0 20px;
    img {
      width: 60px;
    }
  }

  @media only screen and (max-width: 1280px) {
    i {
      font-size: 12px !important;
    }
    img {
      width: 80px !important;
    }
  }
`;

const MainMenu = styled.div`
  margin-top: 100px;

  @media only screen and (max-width: 768px) {
    margin: 0 20px;
  }

  .xvs-active-icon {
    display: none;
  }

  a {
    padding: 7px;
    i,
    img {
      width: 20%;
      margin: 0 10%;
      svg {
        fill: var(--color-text-main);
      }
    }
    .transaction {
      width: 14%;
      margin: 0 4% 0 12%;
    }
    img {
      width: 10%;
      margin: 0 13%;
    }
    span {
      width: 80%;
    }
    @media only screen and (max-width: 1440px) {
      span {
        font-size: 14px;
      }
    }

    @media only screen and (max-width: 1280px) {
      span {
        font-size: 12px;
      }
    }
    &:not(:last-child) {
      margin-bottom: 15px;
    }

    &:hover {
      svg {
        fill: var(--color-yellow);
      }
      path {
        fill: var(--color-yellow);
      }
      span {
        color: var(--color-yellow);
      }
      .xvs-icon {
        display: none;
      }
      .xvs-active-icon {
        display: block;
      }
    }
  }

  .active {
    background-color: var(--color-bg-active);
    svg {
      fill: var(--color-yellow);
    }
    span {
      color: var(--color-yellow);
    }
    path {
      fill: var(--color-yellow);
    }
    .xvs-icon {
      display: none;
    }
    .xvs-active-icon {
      display: block;
    }
  }

  @media only screen and (max-width: 768px) {
    display: none;
  }
`;

const FaucetMenu = styled.div`
  width: 100%;
  margin-top: auto;
  margin-bottom: 20px;
  a {
    padding: 7px 0px;
    svg {
      fill: var(--color-text-main);
      margin-left: 34px;
      margin-right: 26px;
    }
    &:not(:last-child) {
      margin-bottom: 48px;
    }

    &:hover {
      svg {
        fill: var(--color-yellow);
      }
      span {
        color: var(--color-yellow);
      }
    }

    @media only screen and (max-width: 1440px) {
      span {
        font-size: 14px;
      }
    }

    @media only screen and (max-width: 1280px) {
      span {
        font-size: 12px;
      }
    }
  }
  .active {
    background-color: var(--color-bg-active);
    svg {
      fill: var(--color-yellow);
    }
    span {
      color: var(--color-yellow);
    }
  }

  @media only screen and (max-width: 768px) {
    display: none;
  }
`;

const TotalValue = styled.div`
  width: 100%;
  margin-bottom: 20px;

  > div {
    span:first-child {
      word-break: break-all;
      text-align: center;
    }
  }

  @media only screen and (max-width: 768px) {
    display: none;
  }
`;

const MobileMenu = styled.div`
  display: none;

  @media only screen and (max-width: 768px) {
    display: block;
    position: relative;
    .ant-select {
      .ant-select-selection {
        background-color: transparent;
        border: none;
        color: var(--color-text-main);
        font-size: 17px;
        font-weight: 900;
        color: var(--color-text-main);
        margin-top: 4px;
        i {
          color: var(--color-text-main);
        }
      }
    }
  }
`;

const ConnectButton = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;

  @media only screen and (max-width: 768px) {
    margin: 0;
  }

  .connect-btn {
    width: 114px;
    height: 30px;
    border-radius: 5px;
    background-image: linear-gradient(to right, #f2c265, #f7b44f);

    @media only screen and (max-width: 768px) {
      width: 100px;
    }

    .MuiButton-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-main);
      text-transform: capitalize;

      @media only screen and (max-width: 768px) {
        font-size: 12px;
      }
    }
  }
`;

const { Option } = Select;

let metamask = null;
let accounts = [];
let metamaskWatcher = null;
let walletType = null;
const abortController = new AbortController();

const format = commaNumber.bindWith(',', '.');

function Sidebar({ history, settings, setSetting, getGovernanceVenus }) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isMarketInfoUpdating, setMarketInfoUpdating] = useState(false);
  const [error, setError] = useState('');
  const [web3, setWeb3] = useState(null);
  const [awaiting, setAwaiting] = useState(false);
  const [totalVaiMinted, setTotalVaiMinted] = useState('0');
  const [tvl, setTVL] = useState(new BigNumber(0));
  const [wcUri, setWcUri] = useState(null);

  const defaultPath = history.location.pathname.split('/')[1];

  useEffect(() => {
    if (settings.walletType) {
      walletType = settings.walletType;
    }
  }, [settings.walletType]);

  const checkNetwork = () => {
    let netId;
    if (window.BinanceChain && settings.walletType === 'binance') {
      netId = +window.BinanceChain.chainId;
    } else {
      netId = window.ethereum.networkVersion
        ? +window.ethereum.networkVersion
        : +window.ethereum.chainId;
    }
    if (netId) {
      if (netId === 97 || netId === 56) {
        if (netId === 97 && process.env.REACT_APP_ENV === 'prod') {
          toast.error({
            title: `You are currently visiting the Binance Testnet Smart Chain Network. Please change your metamask to access the Binance Smart Chain Main Network`
          });
        } else if (netId === 56 && process.env.REACT_APP_ENV === 'dev') {
          toast.error({
            title: `You are currently visiting the Binance Smart Chain Main Network. Please change your metamask to access the Binance Testnet Smart Chain Network`
          });
        } else {
          setSetting({
            wrongNetwork: false
          });
          return;
        }
      } else {
        toast.error({
          title: `Venus is only supported on Binance Smart Chain Network. Please confirm you installed Metamask and selected Binance Smart Chain Network`
        });
      }
      setSetting({
        wrongNetwork: true
      });
    } else {
      toast.error({
        title: `Venus is only supported on Binance Smart Chain Network. Please confirm you installed Metamask and selected Binance Smart Chain Network`
      });
    }
  };

  useEffect(() => {
    if (window.ethereum || window.BinanceChain) {
      window.addEventListener('load', () => {
        checkNetwork();
      });
    }
  }, [window.ethereum, window.BinanceChain]);

  // ---------------------------------MetaMask connect-------------------------------------
  const withTimeoutRejection = async (promise, timeout) => {
    const sleep = new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error(constants.TIMEOUT)), timeout)
    );
    return Promise.race([promise, sleep]);
  };

  const handleWatch = useCallback(async () => {
    if (!walletType) return;
    if (window.ethereum) {
      const accs = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accs[0]) {
        accounts = [];
        clearTimeout(metamaskWatcher);
        setSetting({ selectedAddress: null });
      }
    }
    if (metamaskWatcher) {
      clearTimeout(metamaskWatcher);
    }

    if (!web3 || !accounts.length) {
      setAwaiting(true);
    }

    try {
      const isLocked = error && error.message === constants.LOCKED;

      if (!metamask || isLocked) {
        metamask = await withTimeoutRejection(
          MetaMaskClass.initialize(undefined, walletType), // if option is existed, add it
          20 * 1000 // timeout
        );
      }
      const [tempWeb3, tempAccounts, latestBlockNumber] = await Promise.all([
        metamask.getWeb3(),
        metamask.getAccounts(walletType),
        metamask.getLatestBlockNumber()
      ]);

      accounts = tempAccounts;
      setWeb3(tempWeb3);
      setError(null);
      setAwaiting(false);
      setSetting({ 
        selectedAddress: tempAccounts[0],
        latestBlockNumber,
       });
      metamaskWatcher = setTimeout(() => {
        clearTimeout(metamaskWatcher);
        handleWatch();
      }, 3000);
    } catch (err) {
      setSetting({ selectedAddress: null });
      accounts = [];
      setWeb3(null);
      setError(err);
      setAwaiting(false);
    }
  }, [error, web3]);

  // --------------------Binance Wallet Connect---------------------------------
  const handleBinance = () => {
    if (window.BinanceChain) {
      clearTimeout(metamaskWatcher);
      walletType = 'binance';
      setSetting({ walletType: 'binance' });
      setError(MetaMaskClass.hasWeb3() ? '' : new Error(constants.NOT_INSTALLED));
      handleWatch();
    }
  };

  const handleMetaMask = () => {
    clearTimeout(metamaskWatcher);
    walletType = 'metamask';
    setSetting({ walletType: 'metamask' });
    setError(MetaMaskClass.hasWeb3() ? '' : new Error(constants.NOT_INSTALLED));
    handleWatch();
  };

  const setDecimals = async () => {
    const decimals = {};
    Object.values(constants.CONTRACT_TOKEN_ADDRESS).forEach(async item => {
      decimals[`${item.id}`] = {};
      if (item.id !== 'bnb') {
        const tokenContract = getTokenContract(item.id);
        const tokenDecimals = await methods.call(
          tokenContract.methods.decimals,
          []
        );
        const vBepContract = getVbepContract(item.id);
        const vtokenDecimals = await methods.call(
          vBepContract.methods.decimals,
          []
        );
        decimals[`${item.id}`].token = Number(tokenDecimals);
        decimals[`${item.id}`].vtoken = Number(vtokenDecimals);
        decimals[`${item.id}`].price = 18 + 18 - Number(tokenDecimals);
      } else {
        decimals[`${item.id}`].token = 18;
        decimals[`${item.id}`].vtoken = 8;
        decimals[`${item.id}`].price = 18;
      }
    });
    setSetting({ decimals });
  };

  const initSettings = async () => {
    await setDecimals();
    setSetting({
      pendingInfo: {
        type: '',
        status: false,
        amount: 0,
        symbol: ''
      }
    });
  };

  useEffect(() => {
    if (accounts.length !== 0) {
      setIsOpenModal(false);
    }
    return function cleanup() {
      abortController.abort();
    };
  }, [handleWatch, settings.selectedAddress]);

  useEffect(() => {
    handleWatch();
  }, [window, history]);

  const getTotalVaiMinted = async () => {
    // total vai minted
    const vaiContract = getVaiTokenContract();
    let tvm = await methods.call(vaiContract.methods.totalSupply, []);
    tvm = new BigNumber(tvm).div(new BigNumber(10).pow(18));
    setTotalVaiMinted(tvm);
  };

  const getMarkets = async () => {
    const res = await promisify(getGovernanceVenus, {});
    if (!res.status) {
      return;
    }

    const markets = Object.keys(constants.CONTRACT_VBEP_ADDRESS)
      .map(item =>
        res.data.markets.find(
          market => market.underlyingSymbol.toLowerCase() === item.toLowerCase()
        )
      )
      .filter(item => !!item);
    setSetting({
      markets,
      dailyVenus: res.data.dailyVenus
    });
  };

  useEffect(() => {
    let updateTimer;
    updateTimer = setInterval(() => {
      if (settings.selectedAddress) {
        getMarkets();
      }
    }, 5000);
    return function cleanup() {
      abortController.abort();
      if (updateTimer) {
        clearInterval(updateTimer);
      }
    };
  }, [settings.selectedAddress]);

  const onChangePage = value => {
    history.push(`/${value}`);
  };

  useEffect(() => {
    if (checkIsValidNetwork(settings.walletType)) {
      getTotalVaiMinted();
    }
  }, [settings.markets]);

  useEffect(() => {
    if (window.ethereum || window.BinanceChain) {
      if (
        !settings.accountLoading &&
        checkIsValidNetwork(settings.walletType)
      ) {
        initSettings();
      }
    }
    return function cleanup() {
      abortController.abort();
    };
  }, [settings.accountLoading]);

  useEffect(() => {
    if (!settings.selectedAddress || !walletType) {
      return;
    }
    if (
      window.ethereum &&
      settings.walletType !== 'binance' &&
      checkIsValidNetwork(settings.walletType)
    ) {
      window.ethereum.on('accountsChanged', accs => {
        walletType = 'metamask'
        setSetting({
          selectedAddress: accs[0],
          accountLoading: true,
          walletType: 'metamask'
        });
      });
    } else if (window.BinanceChain && settings.walletType === 'binance' && checkIsValidNetwork(settings.walletType)) {
      window.BinanceChain.on('accountsChanged', accs => {
        walletType = 'binance'
        setSetting({
          selectedAddress: accs[0],
          accountLoading: true,
          walletType: 'binance'
        });
      });
    }
  }, [window.ethereum, window.BinanceChain, settings.selectedAddress]);

  const updateMarketInfo = async () => {
    const accountAddress = settings.selectedAddress;
    if (
      !accountAddress ||
      !settings.decimals ||
      !settings.markets ||
      isMarketInfoUpdating
    ) {
      return;
    }
    const appContract = getComptrollerContract();
    const vaiContract = getVaiTokenContract();

    setMarketInfoUpdating(true);

    try {
      let [vaultVaiStaked, venusVAIVaultRate] = await Promise.all([
        methods.call(vaiContract.methods.balanceOf, [
          constants.CONTRACT_VAI_VAULT_ADDRESS
        ]),
        methods.call(appContract.methods.venusVAIVaultRate, [])
      ]);
      // Total Vai Staked
      vaultVaiStaked = new BigNumber(vaultVaiStaked).div(1e18);

      // venus vai vault rate
      venusVAIVaultRate = new BigNumber(venusVAIVaultRate)
        .div(1e18)
        .times(20 * 60 * 24);

      // VAI APY
      const xvsMarket = settings.markets.find(
        ele => ele.underlyingSymbol === 'XVS'
      );
      const vaiAPY = new BigNumber(venusVAIVaultRate)
        .times(xvsMarket ? xvsMarket.tokenPrice : 0)
        .times(365 * 100)
        .div(vaultVaiStaked)
        .dp(2, 1)
        .toString(10);

      const totalLiquidity = (settings.markets || []).reduce(
        (accumulator, market) => {
          return new BigNumber(accumulator).plus(
            new BigNumber(market.totalSupplyUsd)
          );
        },
        vaultVaiStaked
      );
      setSetting({
        vaiAPY,
        vaultVaiStaked
      });

      setTVL(totalLiquidity);
      setMarketInfoUpdating(false);
    } catch (error) {
      console.log(error);
      setMarketInfoUpdating(false);
    }
  };

  const handleAccountChange = async () => {
    await updateMarketInfo();
    setSetting({
      accountLoading: false
    });
  };

  useEffect(() => {
    updateMarketInfo();
  }, [settings.markets]);

  useEffect(() => {
    if (!settings.selectedAddress) return;
    handleAccountChange();
  }, [settings.selectedAddress]);
  return (
    <SidebarWrapper>
      <Logo>
        <NavLink to="/" activeClassName="active">
          <img src={logoImg} alt="logo" className="logo-text" />
        </NavLink>
      </Logo>
      <MainMenu>
        <NavLink
          className="flex flex-start align-center"
          to="/dashboard"
          activeClassName="active"
        >
          <Icon type="home" theme="filled" />
          <Label primary>Dashboard</Label>
        </NavLink>
        <NavLink
          className="flex flex-start align-center"
          to="/vote"
          activeClassName="active"
        >
          <Icon type="appstore" />
          <Label primary>Vote</Label>
        </NavLink>
        <NavLink
          className="flex flex-start align-center"
          to="/xvs"
          activeClassName="active"
        >
          <img className="xvs-icon" src={XVSIcon} alt="xvs" />
          <img className="xvs-active-icon" src={XVSActiveIcon} alt="xvs" />
          <Label primary>XVS</Label>
        </NavLink>
        <NavLink
          className="flex flex-start align-center"
          to="/market"
          activeClassName="active"
        >
          <Icon type="area-chart" />
          <Label primary>Market</Label>
        </NavLink>
        <NavLink
          className="flex flex-start align-center"
          to="/vault"
          activeClassName="active"
        >
          <Icon type="golden" theme="filled" />
          <Label primary>Vault</Label>
        </NavLink>
        <NavLink
          className="flex flex-start align-center"
          to="/transaction"
          activeClassName="active"
        >
          <svg
            className="transaction"
            width="12"
            height="16"
            viewBox="0 0 12 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M0 0H7.488L12 4.20571V16H0V0ZM1.92 14.1714H10.08V5.02857H6.72V1.82857H1.92V14.1714ZM3.84703 8.62036H8.16703V6.79179H3.84703V8.62036ZM3.84703 12.2775H8.16703V10.449H3.84703V12.2775Z"
              fill="white"
            />
          </svg>
          <div className="flex flex-column align-center">
            <Label primary>Transaction</Label>
            <Label primary>History</Label>
          </div>
        </NavLink>
      </MainMenu>
      <FaucetMenu>
        {process.env.REACT_APP_ENV === 'dev' && (
          <NavLink
            className="flex just-center"
            to="/faucet"
            activeClassName="active"
          >
            <Label primary>Faucet</Label>
          </NavLink>
        )}
      </FaucetMenu>
      {settings.selectedAddress && (
        <TotalValue>
          <div className="flex flex-column align-center just-center">
            <Label primary>
              ${format(new BigNumber(tvl).dp(2, 1).toString(10))}
            </Label>
            <Label className="center">Total Value Locked</Label>
          </div>
        </TotalValue>
      )}
      {settings.selectedAddress && (
        <TotalValue>
          <div className="flex flex-column align-center just-center">
            <Label primary>
              {format(
                getBigNumber(totalVaiMinted)
                  .dp(0, 1)
                  .toString(10)
              )}
            </Label>
            <Label className="center">Total VAI Minted</Label>
          </div>
        </TotalValue>
      )}
      <ConnectButton>
        <Button
          className="connect-btn"
          onClick={() => {
            setIsOpenModal(true);
          }}
        >
          {!settings.selectedAddress
            ? 'Connect'
            : `${settings.selectedAddress.substr(
                0,
                6
              )}...${settings.selectedAddress.substr(
                settings.selectedAddress.length - 4,
                4
              )}`}
        </Button>
      </ConnectButton>
      <MobileMenu id="main-menu">
        <Select
          defaultValue={defaultPath}
          style={{ width: 120, marginRight: 10 }}
          getPopupContainer={() => document.getElementById('main-menu')}
          dropdownMenuStyle={{
            backgroundColor: '#090d27'
          }}
          dropdownClassName="asset-select"
          onChange={onChangePage}
        >
          <Option className="flex align-center just-center" value="dashboard">
            <Label size={14} primary>
              Dashboard
            </Label>
          </Option>
          <Option className="flex align-center just-center" value="vote">
            <Label size={14} primary>
              Vote
            </Label>
          </Option>
          <Option className="flex align-center just-center" value="xvs">
            <Label size={14} primary>
              XVS
            </Label>
          </Option>
          <Option className="flex align-center just-center" value="market">
            <Label size={14} primary>
              Market
            </Label>
          </Option>
          <Option className="flex align-center just-center" value="vault">
            <Label size={14} primary>
              Vault
            </Label>
          </Option>
          <Option className="flex align-center just-center" value="transaction">
            <Label size={14} primary>
              Transaction History
            </Label>
          </Option>
          {process.env.REACT_APP_ENV === 'dev' && (
            <Option className="flex align-center just-center" value="faucet">
              <Label size={14} primary>
                Faucet
              </Label>
            </Option>
          )}
        </Select>
      </MobileMenu>
      <ConnectModal
        visible={isOpenModal}
        web3={web3}
        error={error}
        wcUri={wcUri}
        awaiting={awaiting}
        walletType={walletType}
        onCancel={() => setIsOpenModal(false)}
        onConnectMetaMask={handleMetaMask}
        onConnectBinance={handleBinance}
        onBack={() => setWcUri(null)}
      />
    </SidebarWrapper>
  );
}

Sidebar.propTypes = {
  history: PropTypes.object,
  settings: PropTypes.object,
  setSetting: PropTypes.func.isRequired,
  getGovernanceVenus: PropTypes.func.isRequired
};

Sidebar.defaultProps = {
  settings: {},
  history: {}
};

const mapStateToProps = ({ account }) => ({
  settings: account.setting
});

const mapDispatchToProps = dispatch => {
  const { setSetting, getGovernanceVenus } = accountActionCreators;

  return bindActionCreators(
    {
      setSetting,
      getGovernanceVenus
    },
    dispatch
  );
};

export default compose(
  withRouter,
  connectAccount(mapStateToProps, mapDispatchToProps)
)(Sidebar);
