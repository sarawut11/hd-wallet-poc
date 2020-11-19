import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { hot } from 'react-hot-loader/root';
import { History } from 'history';
import { Events, Keyring } from '@shapeshiftoss/hdwallet-core';
import { WebUSBLedgerAdapter } from '@shapeshiftoss/hdwallet-ledger-webusb';
import { Store } from '../store';
import Routes from '../Routes';

type Props = {
  store: Store;
  history: History;
};

const Root = ({ store, history }: Props) => {
  let hdWallet;
  const keyring = new Keyring();
  const ledgerAdapter = WebUSBLedgerAdapter.useKeyring(keyring);

  keyring.on(['*', '*', Events.CONNECT], async (deviceId) => {
    hdWallet = keyring.get(deviceId);
  });

  try {
    // eslint-disable-next-line promise/catch-or-return
    ledgerAdapter.initialize().then(async () => {
      // eslint-disable-next-line no-restricted-syntax
      for (const [deviceID] of Object.entries(keyring.wallets)) {
        hdWallet = keyring.get(deviceID);
      }

      hdWallet = keyring.get();
      // eslint-disable-next-line promise/always-return
      if (hdWallet) {
        if (hdWallet.transport) {
          await hdWallet.transport.connect();
        }
        // Initializing a native wallet will immediately prompt for the mnemonic
        if ((await hdWallet.getModel()) !== 'Native') {
          await hdWallet.initialize();
        }
      } else {
        try {
          hdWallet = await ledgerAdapter.pairDevice();
        } catch (e) {
          console.log('initializeHDWallet > ', e);
        }
      }
      console.log('hdWallet', hdWallet);
    });
  } catch (e) {
    console.error('Could not initialize LedgerAdapter', e);
  }

  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Routes />
      </ConnectedRouter>
    </Provider>
  );
};

export default hot(Root);
