import { useState, useEffect, useRef } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import * as QRCodeReact from 'qrcode.react'
import './App.css'

const QRCode = QRCodeReact.default || QRCodeReact.QRCodeSVG || QRCodeReact

function App() {
  const [recieveAddr, setReceiveAddr] = useState('')
  const [chainId, setChainId] = useState('')
  const [tokenAddr, setTokenAddr] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [tokenDecimals, setTokenDecimals] = useState('18')

  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const qrRef = useRef(null)
  const [toast, setToast] = useState(null)

  const knownChains = [
    {id:1, name:"Ethereum Mainnet"},
    {id:56, name:"BNB Smart Chain"},
    {id:8453, name:"Base"},
    {id:10, name:"OP Mainnet"},
    {id:42161, name:"Arbitrum One"},
    {id:43114, name:"Avalanche C-Chain"},
    {id:137, name:"Polygon PoS"},
  ]

  // This array contains the options for the <select> menu
  const presetTokensArray = [
    // The first option is the default/custom state
    { id: "", label: "Custom Token (clear blanks)" },

    // The tokens derived from your presetTokens object
    { id: "eth:ETH", label: "ETH (Mainnet)" },
    { id: "eth:USDC", label: "USDC (Mainnet)" },
    { id: "base:ETH", label: "ETH (Base)" },
    { id: "base:USDC", label: "USDC (Base)" },
    { id: "op:ETH", label: "ETH (OP Mainnet)" },
    { id: "op:USDC", label: "USDC (OP Mainnet)" },
    { id: "arb:ETH", label: "ETH (Arbitrum One)" },
    { id: "arb:USDC", label: "USDC (Arbitrum One)" },
    { id: "pol:POL", label: "POL (Polygon PoS)" },
    { id: "pol:USDC", label: "USDC (Polygon PoS)" },
    { id: "avax-c:AVAX", label: "AVAX (Avalanche C-Chain)" },
    { id: "avax-c:USDC", label: "USDC (Avalanche C-Chain)" }
  ];

  const presetTokens = {
    "eth:ETH": {
      chainId: "1",
      tokenAddr: "", // Native token, address is empty
      tokenDecimals: "18",
    },
    "eth:USDC": {
      chainId: "1",
      tokenAddr: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      tokenDecimals: "6",
    },
    "base:ETH": {
      chainId: "8453",
      tokenAddr: "",
      tokenDecimals: "18",
    },
    "base:USDC": {
      chainId: "8453",
      tokenAddr: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      tokenDecimals: "6",
    },
    "op:ETH": {
      chainId: "10",
      tokenAddr: "",
      tokenDecimals: "18",
    },
    "op:USDC": {
      chainId: "10",
      tokenAddr: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      tokenDecimals: "6",
    },
    "arb:ETH": {
      chainId: "42161",
      tokenAddr: "",
      tokenDecimals: "18",
    },
    "arb:USDC": {
      chainId: "10",
      tokenAddr: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      tokenDecimals: "6",
    },
    "pol:POL": {
      chainId: "137",
      tokenAddr: "",
      tokenDecimals: "18",
    },
    "pol:USDC": {
      chainId: "137",
      tokenAddr: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      tokenDecimals: "6",
    },
    "avax-c:AVAX": {
      chainId: "43114",
      tokenAddr: "", // Native token
      tokenDecimals: "18",
    },
    "avax-c:USDC": {
      chainId: "43114",
      tokenAddr: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      tokenDecimals: "6",
    },
  };

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(id)
  }, [toast])

  // Auto-fill address when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      setReceiveAddr(address)
    }
  }, [address, isConnected])

  const handleConnectWallet = async () => {
    // Connect to first available connector (injected - MetaMask, Brave, etc.)
    const connector = connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  function quickTokenSelector(identifier) {
    const defaultState = {
      chainId: "",
      tokenAddr: "",
      tokenAmount: "", // Always cleared/defaulted
      tokenDecimals: "",
    };

    // Look up the preset, fall back to defaultState if the identifier is not found
    const preset = presetTokens[identifier] || defaultState;

    // Destructure the values you need
    const { chainId, tokenAddr, tokenDecimals } = preset;

    // Apply the state updates
    setChainId(chainId);
    setTokenAddr(tokenAddr);
    setTokenAmount(defaultState.tokenAmount); // Always clear the amount
    setTokenDecimals(tokenDecimals);
  }

  function generateERC681Link() {
    if (!recieveAddr) return null

    let link = ''

    if (tokenAddr) {
      // Token transfer: ethereum:{tokenAddr}/transfer?address={receiverAddr}&uint256={amount}e{decimals}
      link = `ethereum:pay-${tokenAddr}`
      if (chainId) {
        link += `@${chainId}`
      }
      link += `/transfer?address=${recieveAddr}`
      if (tokenAmount) {
        const decimals = parseInt(tokenDecimals) || 0
        link += `&uint256=${tokenAmount}e${decimals}`
      }
    } else {
      // Native token transfer: ethereum:{receiverAddr}?value={amount}e{decimals}
      link = `ethereum:pay-${recieveAddr}`
      if (chainId) {
        link += `@${chainId}`
      }
      if (tokenAmount) {
        const decimals = parseInt(tokenDecimals) || 18
        link += `?value=${tokenAmount}e${decimals}`
      }
    }

    return link
  }

  function copyToClipboard() {
    const link = generateERC681Link()
    if (link) {
      navigator.clipboard.writeText(link)
      setToast('Link copied to clipboard!')
    }
  }
  // Create a PNG blob of the rendered QR (includes a white border)
  async function getQrPngBlob() {
    const container = qrRef.current
    if (!container) throw new Error('QR container not found')

    const svg = container.querySelector('svg')
    const canvasEl = container.querySelector('canvas')

    if (canvasEl) {
      const size = canvasEl.width || canvasEl.clientWidth || 256
      const border = Math.max(6, Math.round(size * 0.04))
      const canvas = document.createElement('canvas')
      canvas.width = size + border * 2
      canvas.height = size + border * 2
      const ctx = canvas.getContext('2d')
      // White background (and border area)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(canvasEl, border, border, size, size)
      return await new Promise((res) => canvas.toBlob(res, 'image/png'))
    }

    if (svg) {
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svg)
      const svg64 = btoa(unescape(encodeURIComponent(svgString)))
      const img = new Image()
      const svgDataUrl = 'data:image/svg+xml;base64,' + svg64

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = svgDataUrl
      })

      const size = parseInt(svg.getAttribute('width')) || img.width || 256
      const border = Math.max(6, Math.round(size * 0.04))
      const canvas = document.createElement('canvas')
      canvas.width = size + border * 2
      canvas.height = size + border * 2
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, border, border, size, size)
      return await new Promise((res) => canvas.toBlob(res, 'image/png'))
    }

    throw new Error('No QR element found')
  }

  async function copyQrAsImage() {
    try {
      const blob = await getQrPngBlob()
      if (navigator.clipboard && navigator.clipboard.write && blob) {
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        setToast('QR image copied to clipboard!')
      } else if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'qr.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        setToast('QR image downloaded (clipboard not available).')
      }
    } catch (err) {
      console.error(err)
      setToast('Failed to copy QR image.')
    }
  }

  async function downloadQrPng() {
    try {
      const blob = await getQrPngBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qr.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setToast('QR image downloaded.')
    } catch (err) {
      console.error(err)
      setToast('Failed to download QR image.')
    }
  }

  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Simple ERC-681 Link Generator</h1>
      </header>
      <form>
        <div className="form-group">
          <label>Receiver Address Autofill</label>
          <div>
            {isConnected ? (
              <button onClick={() => disconnect()}>
                Disconnect ({address?.slice(0, 6)}...{address?.slice(-4)})
              </button>
            ) : (
              <button onClick={handleConnectWallet}>
                Connect Wallet
              </button>
            )}
          </div>
          <small className="helper-text">If you have a wallet in your browser, connect it to autofill your address. In some cases this may happen automatically.</small>
        </div>
        <div className="form-group">
          <label htmlFor="to_address">Receiver Address</label>
          <input
            id="to_address"
            value={recieveAddr}
            onChange={(e) => setReceiveAddr(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="quick_token_select">Quick Select Tokens</label>
          <select
            id="quick_token_select"
            defaultValue=""
            onChange={(e) => { quickTokenSelector(e.target.value) }} >
            {presetTokensArray.map(token => (
              <option key={token.id} value={token.id} >
                {token.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="chainid">Chain ID</label>
          <input
            id="chainid"
            list="known-chains"
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
          />
          <small className="helper-text">The Chain ID is a number; if this field is blank some known chains will be listed for you</small>
          <datalist id="known-chains">
            {knownChains.map(chain => (<option key={chain.id} value={chain.id}>{chain.name}</option>))}
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor="token_addr">Token Contract Address</label>
          <input
            id="token_addr"
            value={tokenAddr}
            onChange={(e) => setTokenAddr(e.target.value)}
          />
          <small className="helper-text">Leave blank to transfer ETH or other native token</small>
        </div>
        <div className="form-group">
          <label htmlFor="token_amount">Token Amount</label>
          <input
            id="token_amount"
            type="number"
            placeholder="e.g., 100.50"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
          />
          <small className="helper-text">Optional: Specify the amount to transfer</small>
        </div>
        <div className="form-group">
          <label htmlFor="token_decimals">Token Decimals</label>
          <input
            id="token_decimals"
            type="number"
            placeholder="e.g., 18 for most tokens"
            value={tokenDecimals}
            onChange={(e) => setTokenDecimals(e.target.value)}
          />
          <small className="helper-text">Number of decimal places for the token (e.g., 18 for most tokens, 6 for USDC)</small>
        </div>
        <button type="button" onClick={copyToClipboard} style={{ marginTop: '1rem' }}>
          Generate & Copy Link
        </button>
      </form>

      {generateERC681Link() && (
        <div className="results-section">
          <h2>Generated Link</h2>
          <div className="link-box">
            <code>{generateERC681Link()}</code>
            <button type="button" onClick={copyToClipboard}>Copy</button>
          </div>

          <div>
            <h2>QR Code</h2>
          </div>
          <div className="qr-container" ref={qrRef}>
            <QRCode value={generateERC681Link()} size={256} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
            <button type="button" onClick={copyQrAsImage}>Copy QR Image</button>
            <button type="button" onClick={downloadQrPng}>Download PNG</button>
          </div>
          <div>
            <small className="qr-helper">Show this to someone to request a payment</small>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

export default App
