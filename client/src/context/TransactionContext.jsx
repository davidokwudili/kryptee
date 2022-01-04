import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEtheruemContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log('getEtheruemContract', {
        provider,
        signer,
        transactionContract
    });

    return transactionContract;
}

export const TransactionProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('');
    const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState([]);

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
    }

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert('Please install metamask');

            const accounts = await ethereum.request({ method: 'eth_accounts' });

            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                console.log(accounts[0]);

                // get all transactions
                getAllTransactions();
            } else {
                console.log('No account found.')
            }

        } catch (error) {
            console.error(error);
            throw new Error('No ethereum object.');
        }
    }

    const checkIfTransactionsExists = async () => {
        try {
            if (ethereum) {
                const transactionsContract = getEtheruemContract();
                const currentTransactionCount = await transactionsContract.getTransactionCount();

                window.localStorage.setItem('transactionCount', currentTransactionCount);
            }
        } catch (error) {
            console.log(error);

            throw new Error('No ethereum object');
        }
    };


    const connectWallet = async () => {
        try {
            if (!ethereum) return alert('Please install metamask');

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.error(error);
            throw new Error('No ethereum object.');
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert('Please install metamask');

            // get the form data...
            const { addressTo, amount, keyword, message } = formData;

            const transactionContract = getEtheruemContract();
            const parsedAmount = ethers.utils.parseEther(amount);

            // send ethereum request             
            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', // 21000 GWEI // hex to decimal
                    value: parsedAmount._hex, //0.00001
                }]
            });

            // consume the solidity function and pass the inputed parameters.
            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`);

            // get transaction count from the abi
            const transactionCount = await transactionContract.getTransactionCount();

            setTransactionCount(transactionCount.toNumber()); 

            window.reload();
        } catch (error) {
            console.error(error);
            throw new Error('No ethereum object.');
        }
    }


    const getAllTransactions = async () => {
        try {
            if (ethereum)
            {
                const transactionsContract = getEtheruemContract();

                const availableTransactions = await transactionsContract.getAllTransactions();

                const structuredTransactions = availableTransactions.map((transaction) => ({
                    addressTo: transaction.receiver,
                    addressFrom: transaction.sender,
                    timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    amount: parseInt(transaction.amount._hex) / (10 ** 18)
                }));

                console.log(structuredTransactions);

                setTransactions(structuredTransactions);
            } else {
                console.log("Ethereum is not present");
            }
        } catch (error) {
            console.log(error);
        }
    };


    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExists();
    }, []);



    return (
        <TransactionContext.Provider value={{
            isLoading,
            connectWallet,
            currentAccount,
            formData,
            setFormData,
            sendTransaction,
            transactions,
            handleChange
        }}>
            {children}
        </TransactionContext.Provider>
    );
}