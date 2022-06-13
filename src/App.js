import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/Waveportal.json"; 

const App = () => {
  const contractAddress = "0x1EA20331EED21C6e01D5aaC010dBae882549E9B6"

   const shortenAddress = (address, no) => `${address.slice(0, no)}...${address.slice(address.length - 4)}`
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [processing, setProcessing] = useState({
    v:false,
    txt: `Processing...`
  });
  const [ErrorPop, setErrorPop] = useState({
    v:false,
    txt: `...`
  });
  const [username, setUsername] = useState("")
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });
  

        console.log(wavesCleaned)

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }



  const contractABI = abi.abi;


  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
        getAllWaves()
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
   
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      checkIfWalletIsConnected()
    } catch (error) {
      console.log(error)
    }
  }
  
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        console.log(count);
        const waveTxn = await wavePortalContract.wave(username || "Oh, niceeee!")
        setUsername("");
        setProcessing({
          v:true,
          txt: `Processing...`
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setProcessing({
          v:true,
          txt: `Almost done...`
        });

        count = await wavePortalContract.getTotalWaves();
        setProcessing({
          ...processing, v:false
        });
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      console.log(error.code);
      if(error.code === `UNPREDICTABLE_GAS_LIMIT`){
        setErrorPop({
          v:true,
          txt: `Kindly wait for 30s to try again`
        });
        setTimeout(() => {
          setErrorPop({...ErrorPop, v:false});
        }, 3600);
      }
      else{
        setErrorPop({
          v:true,
          txt: `Unexpected error occured, try again`
        });
        setTimeout(() => {
          setErrorPop({...ErrorPop, v:false});

        }, 3600);
      }
    }
  }



  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  // const submituser = (e)=>{
  //   e.preventDefault();
  //   wave
  // }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        {`👋`} Hey {currentAccount ? `${shortenAddress(currentAccount, 5)}! How are you doing?` : `there! Can you connect wallet to wave`}
        </div>


        <div className="bio">
         I am <a href="https://github.com/chocoscoding" target={`_blank`} rel="noreferrer noopener"> Chocos</a>, I am working as a  FULLSTACK DEV  at a startup. Cool right? Connect your Ethereum wallet and wave at me with our github username !
        </div>

        <form onSubmit={(e)=> {e.preventDefault();  wave();}}>
          <input type="text" value={username} required onChange={(e) => setUsername(e.target.value)} className="text" />

        <button type="submit" className="waveButton">
          Wave at Me
        </button>
        </form>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}


        {ErrorPop.v && (
          <div className="popup">{ErrorPop.txt}</div>
        )};

        {processing.v && (
          <div className="processing">{processing.txt}</div>
        )}
        <div className="cont">
         {allWaves.map((wave, index) => {
          return (
            <div className="boxreceive" key={index} >
              <div>Address: {shortenAddress(wave.address, 15)}</div>
              <div>Time: {+wave.timestamp.getDate()+
          "/"+(wave.timestamp.getMonth()+1)+
          "/"+wave.timestamp.getFullYear()+
          " "+wave.timestamp.getHours()+
          ":"+wave.timestamp.getMinutes()+
          ":"+wave.timestamp.getSeconds()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}

        </div>
      </div>
    </div>
  );
}

export default App;