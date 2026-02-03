export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">关于 Art RWA</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">我们的愿景</h2>
          <p className="text-muted-foreground leading-relaxed">
            Art RWA 致力于通过区块链技术，让艺术投资变得更加民主化和accessible。
            我们相信，艺术不应该只是少数人的特权，每个人都应该有机会拥有和投资世界级的艺术品。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">什么是 RWA？</h2>
          <p className="text-muted-foreground leading-relaxed">
            RWA（Real World Asset）即现实世界资产代币化，是指将实体资产通过区块链技术转化为数字代币。
            在 Art RWA 平台上，每件实体艺术品都会被代币化为 ERC-20 代币，代表其所有权份额。
            这使得艺术品投资可以被分割成更小的单位，降低了投资门槛。
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">技术架构</h2>
          <div className="space-y-3 text-muted-foreground">
            <p><strong className="text-foreground">区块链：</strong>基于 BNB Chain，低交易费用和高性能</p>
            <p><strong className="text-foreground">智能合约：</strong>使用 Solidity 和 OpenZeppelin 标准，确保安全可靠</p>
            <p><strong className="text-foreground">存储：</strong>艺术品信息和证书永久存储在 IPFS 上</p>
            <p><strong className="text-foreground">交易：</strong>集成 PancakeSwap DEX，提供即时流动性</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">联系我们</h2>
          <p className="text-muted-foreground leading-relaxed">
            如有任何问题或建议，欢迎通过以下方式联系我们：
          </p>
          <div className="mt-4 space-y-2 text-muted-foreground">
            <p>Email: contact@artrwa.com</p>
            <p>Twitter: @ArtRWA</p>
            <p>Discord: discord.gg/artrwa</p>
          </div>
        </section>
      </div>
    </div>
  );
}
