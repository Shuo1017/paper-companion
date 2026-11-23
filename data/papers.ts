import type { Paper } from "@/lib/types";

/**
 * 内置示例论文：摘自 arXiv 公开版本，供零门槛体验。
 * 五档译文与批注为预生成的演示内容（非实时 AI 输出），
 * 上传自己的 PDF 后将由 AI 实时生成。
 */
export const SAMPLE_PAPERS: Paper[] = [
  {
    id: "attention",
    title: "Attention Is All You Need",
    titleZh: "注意力即你所需的一切",
    authors: "Vaswani et al.",
    venue: "NeurIPS 2017 · arXiv:1706.03762",
    year: 2017,
    url: "https://arxiv.org/abs/1706.03762",
    sourceNote: "内置示例 · 摘自 arXiv 公开版本，译文为预生成演示内容",
    sections: [
      {
        id: "abstract",
        title: "摘要",
        note: "摘要是论文的电梯演讲：30 秒说清做了什么、为什么重要。先读这里永远没错。",
        sentences: [
          {
            id: "a1",
            text: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder.",
            translations: [
              "想象一场传话接力赛：一个同学负责读原文（编码器），另一个负责写出译文（解码器）。以前最流行的翻译机器都是这么搭的，只是内部结构特别复杂。",
              "「把一个序列变成另一个序列」的任务（比如中译英），以前主要靠两种神经网络：循环网络和卷积网络。它们都有一个「读入器」（编码器）和一个「写出器」（解码器）。",
              "序列转导（sequence transduction）模型把输入序列映射为输出序列。当时的主流是基于 RNN 或 CNN 的编码器-解码器架构，结构复杂。",
              "当时的 SOTA 序列转导模型几乎都采用复杂的 RNN/CNN 编码器-解码器架构，注意力机制只是可选附件。",
              "开篇先立靶子：主流序列转导依赖复杂的循环/卷积编码器-解码器结构。注意作者刻意强调 complex，为后文 simple 的 Transformer 埋下对照——经典的对比修辞。",
            ],
            role: "交代现状：先说清楚旧方法长什么样，后面提出的新方法才有对照对象。",
            terms: [
              { id: "seq-transduction", term: "序列转导", en: "sequence transduction", explain: "把一个序列变成另一个序列的任务，比如机器翻译（英文句→中文句）、语音识别（声音序列→文字序列）。" },
              { id: "encoder", term: "编码器", en: "encoder", explain: "负责「读懂」输入的部分：把原始数据压缩成模型内部的表示，相当于先理解再动笔。" },
              { id: "decoder", term: "解码器", en: "decoder", explain: "负责「写出」输出的部分：根据编码器给出的理解，一步步生成结果序列。" },
              { id: "rnn", term: "循环神经网络", en: "recurrent neural network (RNN)", explain: "一种「逐词阅读」的网络：每读一个词就更新一次记忆，像人一行行读书。缺点是必须按顺序算，没法并行。" },
            ],
          },
          {
            id: "a2",
            text: "The best performing models also connect the encoder and decoder through an attention mechanism.",
            translations: [
              "成绩最好的机器还装了一支「荧光笔」：写译文时会回头把原文重点圈出来再看一眼，避免忘记前面说了啥。",
              "最好的模型在读写双方之间加了「注意力机制」——生成每个词时，模型会回头重点「看」输入里最相关的部分。",
              "性能最好的模型在编码器与解码器之间引入注意力机制，让解码器生成每个输出时能动态聚焦输入的相关位置。",
              "SOTA 模型普遍用 attention 连接 encoder-decoder，缓解固定长度上下文向量的信息瓶颈。",
              "这句话其实已经暗示了论文的贡献方向：注意力被证明有效，但它还只是 RNN 的「附件」。作者下一步要问：能不能扔掉 RNN，只用注意力？",
            ],
            role: "引出关键配角：注意力机制已经有效，但此时它还只是旧架构的附件。",
            terms: [
              { id: "attention", term: "注意力机制", en: "attention mechanism", explain: "让模型在处理每个位置时，自动「回头看」输入中最相关的部分并分配不同权重——像荧光笔划重点，而不是平均用力。" },
            ],
          },
          {
            id: "a3",
            text: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
            translations: [
              "作者说：我们把复杂的部分全拆了！新机器叫「Transformer（变形金刚）」，只保留「荧光笔」这一个部件，照样翻译得又快又好。",
              "本文提出 Transformer：一个只用注意力机制的全新架构，彻底扔掉循环和卷积这两个传统部件。",
              "作者提出 Transformer，完全基于注意力机制构建，抛弃循环与卷积，结构更简单、更易并行。",
              "本文提出 Transformer，仅用（自）注意力构建编码器-解码器，完全移除循环与卷积依赖，训练并行度显著提升。",
              "核心主张：attention alone is all you need。solely 和 entirely 是全文最强的断言，也是最需要检验的部分——后面的实验必须证明去掉循环/卷积后性能不降反升。",
            ],
            role: "全文论点句：新方法登场，核心卖点是「只用注意力，别的都不要」。",
            terms: [
              { id: "transformer", term: "Transformer", en: "Transformer", explain: "2017 年提出的神经网络架构，完全用注意力机制搭建。后来成为 GPT、BERT 等几乎所有大模型的底座。名字来自「变换」，和变形金刚玩具没有官方关系。" },
              { id: "recurrence", term: "循环", en: "recurrence", explain: "「按顺序一步步算、后一步依赖前一步」的计算方式。RNN 的核心特征，也是它无法并行的根源。" },
              { id: "convolution", term: "卷积", en: "convolution", explain: "用一个小窗口在数据上滑动提取特征的操作，CNN 的核心。在序列任务里窗口只看局部，捕捉远距离关系要堆很多层。" },
            ],
          },
          {
            id: "a4",
            text: "Experiments on two machine translation tasks show that these models are superior in quality while being more parallelizable and requiring significantly less time to train.",
            translations: [
              "他们让新机器参加两场翻译比赛：不仅翻译得更好，还能「同时做很多道题」（并行），练功速度比别人快得多。",
              "在两个机器翻译任务上的实验表明：Transformer 翻译质量更好，还能并行计算，训练时间大大缩短。",
              "在两个机器翻译基准上，模型质量更优，同时更可并行化，训练时间显著减少。",
              "WMT 英德、英法任务上，Transformer 的 BLEU 超过基线；由于没有循环依赖，训练并行度与墙钟时间显著占优。",
              "三重主张：质量更好 + 更并行 + 更快。审稿人会追问：基线是否公平调参？训练时间对比是否同等硬件？后文的表格和训练成本小节就是这些主张的证据。",
            ],
            role: "预告结果：一口气给出三个优势——质量更好、更并行、更快。",
            terms: [
              { id: "parallelizable", term: "可并行化", en: "parallelizable", explain: "多个计算可以同时进行而不是排队。GPU 擅长并行，所以「可并行」直接等于「训练快」。" },
            ],
          },
          {
            id: "a5",
            text: "Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU.",
            translations: [
              "在「英译德」比赛里，新机器考了 28.4 分（分数越高翻译越好），比之前的冠军「组合战队」还高出 2 分多。",
              "在 WMT 2014 英德翻译任务上拿到 28.4 BLEU（衡量翻译质量的指标），比之前最好成绩（包括集成模型）高 2 分以上。",
              "WMT 2014 英→德任务达到 28.4 BLEU，超过此前最佳结果（含集成模型）2 BLEU 以上。",
              "WMT14 En-De 单模型 BLEU 28.4，超越此前 SOTA（含 ensemble）2+ BLEU，在该任务上是很大的提升幅度。",
              "2 BLEU 的提升在这个基准上是显著差距，且是单模型胜过集成。审稿人会关注：测试集是否标准 newstest2014？BLEU 计算脚本是否一致？这些细节决定数字可否复现。",
            ],
            role: "用硬数字证明「质量更好」：第一个具体成绩。",
            terms: [
              { id: "bleu", term: "BLEU", en: "BLEU score", explain: "机器翻译的经典打分指标：比较机器译文和人工参考译文的重合程度，0~100，越高越好。它不完美，但大家都在用，方便横向比较。" },
              { id: "ensemble", term: "集成模型", en: "ensemble", explain: "把多个模型的预测合起来投票/平均，通常比单个模型更准，但推理成本翻倍。单模型打赢集成是很强的成绩。" },
            ],
          },
          {
            id: "a6",
            text: "On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.",
            translations: [
              "另一场「英译法」比赛，它考了 41.8 分，创下单人参赛的新纪录。而且只练了 3 天半——别人练的时间长得多。",
              "英法任务上以 41.8 BLEU 创单模型新纪录，而且只用 8 块 GPU 训练 3.5 天，成本远低于文献中最好的模型。",
              "WMT 2014 英→法任务上，单模型达到 SOTA 的 41.8 BLEU；8 块 GPU 训练 3.5 天，训练成本只是此前最佳模型的一小部分。",
              "En-Fr 单模型 SOTA 41.8 BLEU；8 GPU × 3.5 天的训练成本显著低于同级 SOTA，体现并行化带来的训练效率优势。",
              "成本对比用了 small fraction 这种定性表述，审稿人会去找正文的训练成本表（论文 Table 2）核对 FLOPs 对比。这句把「又好又便宜」压缩进摘要，是很有说服力的收尾。",
            ],
            role: "收尾双杀：第二个任务创纪录 + 训练成本只是别人的零头。",
            terms: [
              { id: "sota", term: "最先进水平", en: "state-of-the-art (SOTA)", explain: "当前所有已发表方法里的最好成绩。论文里说「达到 SOTA」就是「我是目前最强的」。" },
            ],
          },
        ],
      },
      {
        id: "intro",
        title: "引言选段",
        note: "引言的套路：旧范式很繁荣 → 但它有结构性缺陷 → 所以我们需要新东西。读懂这个三段式，引言就不迷路。",
        sentences: [
          {
            id: "i1",
            text: "Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation.",
            translations: [
              "在这之前，翻译界的「老冠军」是一类叫循环神经网络的网络，家族里最厉害的两个成员叫 LSTM 和 GRU，大家做语言任务都用它们。",
              "循环神经网络（尤其是 LSTM 和 GRU 两个变体）是语言建模、机器翻译等序列任务上公认的最强方法。",
              "RNN，特别是 LSTM 与 GRU，已被确立为语言建模、机器翻译等序列建模与转导任务的 SOTA 方法。",
              "引言先立基线：RNN/LSTM/GRU 统治序列建模与转导任务，这是当时文献的共同出发点。",
              "标准的「确立旧范式统治地位」开场，作用是让后面的「推翻」显得有戏剧性。注意作者没有否认 RNN 的效果，只是质疑它的计算结构。",
            ],
            role: "引言第一步：确立旧范式的统治地位。",
            terms: [
              { id: "lstm", term: "长短期记忆网络", en: "LSTM", explain: "RNN 的改良版，加了「门控」机制决定记住什么、忘记什么，缓解了长序列记不住的问题。2017 年前序列任务的主力。" },
              { id: "gru", term: "门控循环单元", en: "GRU", explain: "LSTM 的简化版，门更少、参数更省，效果接近。可以理解为「青春版 LSTM」。" },
              { id: "language-modeling", term: "语言建模", en: "language modeling", explain: "预测「下一个词最可能是什么」的任务。是 GPT 这类模型的基本功，也是机器翻译等任务的基础。" },
            ],
          },
          {
            id: "i2",
            text: "Since then, numerous efforts have continued to push the boundaries of recurrent language models and encoder-decoder architectures.",
            translations: [
              "这些年很多人一直在给这位「老冠军」升级装备，想让它更强。",
              "此后大量工作持续改进循环语言模型和编码器-解码器架构，不断推高性能边界。",
              "大量后续工作持续推进循环语言模型与编码器-解码器架构的能力边界。",
              "社区围绕 RNN 范式持续改进，但都是在旧框架内的增量优化。",
              "一句话带过一大批相关工作，暗示「它们都在旧范式里修修补补」，为接下来的范式级主张清场。",
            ],
            role: "一句话带过相关工作，暗示它们都是旧框架内的改进。",
          },
          {
            id: "i3",
            text: "Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states ht, as a function of the previous hidden state ht−1 and the input for position t.",
            translations: [
              "老冠军有个致命弱点：它像「一个字一个字读书」，必须读完上一个字才能读下一个，没法同时读好几行，所以特别慢。",
              "循环模型沿序列位置一步步计算：第 t 步的状态依赖第 t−1 步的状态和当前输入。就像流水线，下一道工序必须等上一道完成。",
              "RNN 沿序列位置展开计算，隐藏状态 h_t = f(h_{t−1}, x_t)。这种时间步依赖使单个样本内的计算无法并行。",
              "递推关系 h_t = f(h_{t−1}, x_t) 将序列位置与计算时间步对齐，导致样本内训练本质串行。",
              "这是全文对旧范式的「解剖」关键句：指出串行依赖是结构性的，不是工程优化能解决的。后面所有关于并行和长程依赖的论证都从这里长出来。",
            ],
            role: "解剖旧方法的结构性弱点：时间步依赖 → 无法并行。",
            formula: {
              plain: "h_t = f(h_{t−1}, x_t)",
              parts: [
                { symbol: "h_t", meaning: "当前位置的隐藏状态——读完第 t 个词后模型的「记忆」" },
                { symbol: "h_{t−1}", meaning: "上一个位置的隐藏状态——读上一个词后的记忆" },
                { symbol: "x_t", meaning: "当前位置的输入——第 t 个词" },
                { symbol: "f", meaning: "状态更新函数——把旧记忆和新输入揉在一起的方式" },
              ],
            },
            terms: [
              { id: "hidden-state", term: "隐藏状态", en: "hidden state", explain: "网络内部保存的「记忆向量」，概括到目前为止读到的信息。外部看不见，所以叫「隐藏」。" },
            ],
          },
          {
            id: "i4",
            text: "This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.",
            translations: [
              "所以文章越长它越慢，而且没法靠「同时做几道题」补救，因为内存（显存）不够用。",
              "这种「必须排队」的天性让单个样本内无法并行计算；序列越长问题越致命，内存限制还让跨样本批处理也受限。",
              "固有的串行性使训练样本内无法并行化；序列越长问题越严重，内存约束也限制了跨样本批处理。",
              "串行计算阻碍样本内并行，长序列下问题被放大；内存约束进一步限制跨样本 batching，训练效率成为系统性瓶颈。",
              "作者把「慢」从工程抱怨上升为结构缺陷：并行被模型定义本身挡住。这为「去掉循环」提供了最有力的动机。",
            ],
            role: "把弱点推到极致：序列越长越致命，为新方法铺好动机。",
            terms: [
              { id: "batching", term: "批处理", en: "batching", explain: "把多个样本打包一起算，摊薄开销、喂饱 GPU。序列太长时单个样本就占满显存，batch 只能变小，效率进一步下降。" },
            ],
          },
        ],
      },
      {
        id: "method",
        title: "方法速览",
        note: "方法部分开头先交代通用框架（编码器-解码器），再说自己怎么改造。先看懂框架，细节才有位置挂。",
        sentences: [
          {
            id: "m1",
            text: "Most competitive neural sequence transduction models have an encoder-decoder structure.",
            translations: [
              "大多数厉害的翻译机器都分成两个车间：一个负责读（编码器），一个负责写（解码器）。",
              "最有竞争力的序列转导模型都采用编码器-解码器结构：先把输入读懂，再生成输出。",
              "多数有竞争力的神经序列转导模型采用编码器-解码器结构。",
              "方法部分从通用的 encoder-decoder 框架谈起，Transformer 也是该框架的实例，并非另起炉灶。",
              "注意修辞：作者先把自己放进主流框架，再展示内部部件的替换——「框架继承、实现革命」，降低审稿人的抵触。",
            ],
            role: "方法部分开场：先立通用框架。",
          },
          {
            id: "m2",
            text: "The encoder maps an input sequence of symbol representations (x1, ..., xn) to a sequence of continuous representations z = (z1, ..., zn).",
            translations: [
              "读入车间把原文的每个词变成一串数字（机器的「理解」），一个词变一串，排好队。",
              "编码器把输入符号序列 (x1…xn) 转换成连续向量序列 z=(z1…zn)——把词变成数学上可处理的「语义坐标」。",
              "编码器将输入符号表示 (x1,…,xn) 映射为连续表示 z=(z1,…,zn)。",
              "编码器把离散符号序列映射为连续表示序列，为解码器提供含上下文的输入。",
              "形式化定义用了 continuous representations 而不是 embeddings，强调 z 已含上下文信息（Transformer 中由自注意力层堆叠产生），不只是查表嵌入。",
            ],
            role: "形式化定义编码器的工作。",
            formula: {
              plain: "z = (z1, ..., zn)",
              parts: [
                { symbol: "x1…xn", meaning: "输入符号序列——比如原文句子的 n 个词" },
                { symbol: "z1…zn", meaning: "每个输入位置对应的连续表示——含上下文语义的向量" },
              ],
            },
            terms: [
              { id: "continuous-repr", term: "连续表示", en: "continuous representation", explain: "用一串实数（向量）表示一个词/位置，语义相近的词向量距离也近。和「离散符号」（词本身）相对。" },
            ],
          },
          {
            id: "m3",
            text: "Given z, the decoder then generates an output sequence (y1, ..., ym) of symbols one element at a time.",
            translations: [
              "写出车间拿着那串数字，一个词一个词地把译文写出来。",
              "解码器拿到 z 后，逐个生成输出符号序列 (y1…ym)——翻译是一个词一个词写出来的。",
              "给定 z，解码器逐元素生成输出符号序列 (y1,…,ym)。",
              "解码器以编码器表示 z 为条件，自回归地生成输出序列。",
              "one element at a time 承认解码端仍是串行的——Transformer 的并行优势主要在训练阶段（teacher forcing）和编码器端，审稿人不会放过这个边界。",
            ],
            role: "定义解码器的生成方式：逐词生成。",
          },
          {
            id: "m4",
            text: "At each step the model is auto-regressive, consuming the previously generated symbols as additional input when generating the next.",
            translations: [
              "它每写一个词，都要回头看自己刚写过的词——就像写作文时看着前半句写后半句，保证接得上。",
              "模型是「自回归」的：生成下一个词时，把之前生成的词也喂回去当输入，保证上下文连贯。",
              "模型是自回归的：每一步把已生成的符号作为额外输入，用于生成下一个符号。",
              "解码自回归：P(y) = ∏ P(y_t | y_<t, z)，已生成序列参与每一步预测。",
              "自回归假设与传统解码器一致，说明革命发生在「信息如何混合」（注意力替代循环），而不是「生成协议」。这是理解 Transformer 为何能与旧模型无缝对比的关键。",
            ],
            role: "说明自回归性质：已生成的内容参与下一步预测。",
            terms: [
              { id: "autoregressive", term: "自回归", en: "auto-regressive", explain: "「用自己的过去预测自己的未来」：生成第 t 个词时，把前 t−1 个已生成的词当输入。GPT 写文章就是这么一个词一个词蹦的。" },
            ],
          },
        ],
      },
      {
        id: "experiments",
        title: "实验结果",
        note: "实验部分先看两件事：在哪些任务上测（可比性），花了多少算力（成本）。数字要和别人同框比才有意义。",
        sentences: [
          {
            id: "e1",
            text: "We trained our models on two machine translation tasks, these being WMT 2014 English-to-German and WMT 2014 English-to-French.",
            translations: [
              "他们让新机器做了两道翻译大题：一道把英语翻成德语，一道把英语翻成法语，都是很有名的比赛题目。",
              "他们在两个机器翻译任务上训练模型：WMT 2014 的英译德和英译法，这是这个领域公认的基准考题。",
              "模型在两个机器翻译任务上训练：WMT 2014 英→德、英→法。用公开标准数据集，结果才能和别人横向比较。",
              "在 WMT 2014 En-De 与 En-Fr 两个标准翻译基准上训练与评测，保证与既有 SOTA 可比。",
              "选这两个任务是沿用社区惯例以便对齐基线；审稿人会关注预处理、BPE/word-piece 词表、评测集 newstest 年份是否与前人完全一致，否则 BLEU 不可直接比。",
            ],
            role: "交代实验设置：用哪两个公认基准，结果才有可比性。",
            terms: [
              { id: "wmt-benchmark", term: "WMT 翻译基准", en: "WMT benchmark", explain: "机器翻译领域每年举办的公开评测，提供标准训练集和测试集，大家用同一套数据比成绩，结果才公平可比。" },
            ],
          },
          {
            id: "e2",
            text: "Training took three and a half days on eight NVIDIA P100 GPUs for the big model, and only twelve hours for the base model.",
            translations: [
              "最厉害那个版本，用 8 块显卡连练三天半；小一点的版本半天就练完了——比以前那些冠军快得多。",
              "大模型用 8 块英伟达 P100 显卡训练 3.5 天，基础版只要 12 小时。因为能并行，训练时间被大幅压缩。",
              "大模型在 8×P100 上训练 3.5 天，基础模型 12 小时。这正是并行化带来的训练成本优势，是论文主打卖点之一。",
              "big 模型 8×P100 训练 3.5 天、base 12 小时；相比同期需数周训练的 SOTA，墙钟时间显著缩短。",
              "训练成本是核心论据之一；审稿人会核对是否同等硬件、是否计入调参搜索开销，以及 3.5 天是否只是单次训练而非完整实验流程。",
            ],
            role: "用训练时长坐实「更快」这一主张，呼应摘要的成本对比。",
            terms: [
              { id: "gpu", term: "GPU 并行", en: "GPU parallelism", explain: "显卡有成千上万个计算单元，擅长同时算很多件事。模型能并行，就能把显卡喂饱，训练才快得起来。" },
            ],
          },
          {
            id: "e3",
            text: "To evaluate the generalization ability of our model beyond translation, we performed experiments on English constituency parsing, where the output is much more structured and constrained than the input.",
            translations: [
              "为了证明它不只是翻译机器，作者还让它做另一件事：给句子画语法树——这件事答案格式更严格，更能考验真本事。",
              "为了检验模型会不会举一反三，作者又拿「英语成分句法分析」测试：要把句子拆成语法树，输出比翻译更受结构约束。",
              "为评估翻译之外的泛化能力，作者做了英语成分句法分析实验——输出是带结构的句法树，比译文更受约束，能检验模型是否真懂长程结构。",
              "跨任务实验选 constituency parsing：输出空间高度结构化、约束强，可检验注意力对长程依赖与层级结构的建模能力。",
              "泛化论证只靠一个额外任务略显单薄；审稿人会追问是否覆盖更多非翻译任务、与专门的句法模型相比是否仍占优，以支撑「通用架构」的说法。",
            ],
            role: "跨任务泛化证据：证明 Transformer 不止会翻译，是通用架构。",
            terms: [
              { id: "constituency-parsing", term: "成分句法分析", en: "constituency parsing", explain: "把一个句子解析成层级语法树（哪几个词先组成短语、短语再组成句子）。输出必须满足语法规则，比自由翻译受约束得多。" },
            ],
          },
        ],
      },
      {
        id: "conclusion",
        title: "结论",
        note: "结论不是简单复述摘要，而是把贡献抬到「范式」高度，并给出未来方向。读结论能看出作者想让论文被怎样记住。",
        sentences: [
          {
            id: "c1",
            text: "In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention.",
            translations: [
              "总结一句：我们造了个 Transformer，是第一个完全靠「注意力」干活的翻译机器，把以前最常用的一层层「排队读」的部件全换成了「多头注意力」。",
              "本文提出 Transformer：第一个完全基于注意力的序列转导模型，用「多头自注意力」取代了编码器-解码器里最常用的循环层。",
              "结论重申贡献：Transformer 是首个纯注意力序列转导模型，用多头自注意力替换了编码器-解码器中的循环层——这是全文的核心主张。",
              "以 multi-head self-attention 替代 recurrence，构成编码器-解码器的新范式；「first ... entirely on attention」是本文的范式级定位。",
              "「first entirely on attention」是强优先声明；审稿人会核查此前是否确无纯注意力模型（如 circulant/CNN 类），确认 novelty 的边界。",
            ],
            role: "结论主句：把全文贡献压缩成一句范式声明——纯注意力替代循环。",
            terms: [
              { id: "multi-head-attention", term: "多头自注意力", en: "multi-head self-attention", explain: "同时用好几个「注意力头」去看句子的不同关系（有的管语法、有的管指代），再把各自的发现合起来。比单头看得更全面。" },
            ],
          },
          {
            id: "c2",
            text: "We are excited about the future of attention-based models and plan to apply them to other tasks and modalities, extending them to inputs and outputs of types other than word sequences, such as images, audio, and video.",
            translations: [
              "作者很兴奋地说：这套「注意力」招数以后还能用在图片、声音、视频上，不只是文字。后来的 GPT、BERT 真的就是这么火的。",
              "作者展望：把注意力模型推广到图像、音频、视频等非文字序列的任务上。今天的大模型和多模态，正是顺着这条路走过来的。",
              "未来工作：把注意力架构从词序列扩展到图像、音频、视频等模态。事后看，这句展望几乎预言了 Transformer 统治整个深度学习。",
              "作者提出向非序列/多模态输入输出推广，并暗示需要局部注意力以处理更大输入（图像、音视频）——这正是后续 ViT、多模态模型的研究方向。",
              "展望部分较宽泛，未给出具体路径；但历史地看，正是这些方向（长输入的高效注意力、跨模态）成了后续大量工作的起点。",
            ],
            role: "结论收尾：给出面向未来的推广方向，抬高论文的长期影响。",
            terms: [
              { id: "modality", term: "模态", en: "modality", explain: "数据的类型：文字、图像、音频、视频各算一种模态。能同时处理多种模态的模型叫多模态模型。" },
            ],
          },
        ],
      },
    ],
    mindmap: {
      id: "mm-attention",
      label: "Attention Is All You Need · 核心主张",
      detail: "只用注意力就能做出 SOTA 翻译模型：扔掉循环与卷积，换来可并行、训练快、质量高。",
      kind: "root",
      children: [
        {
          id: "mm-attention-abstract",
          sectionId: "abstract",
          label: "摘要",
          detail: "立靶子 → 提出 Transformer → 三重优势 → 硬数字",
          kind: "section",
          children: [
            { id: "mm-a-p1", label: "旧方法：RNN/CNN 编码器-解码器，复杂且串行", kind: "point" },
            { id: "mm-a-p2", label: "新方法：Transformer 纯注意力，可并行、训练快", kind: "point" },
            { id: "mm-a-p3", label: "结果：En-De 28.4 / En-Fr 41.8 BLEU，成本只是零头", kind: "point", children: [
              { id: "mm-a-t1", label: "注意力机制", detail: "处理每个位置时自动回头重点看最相关的部分", kind: "term" },
              { id: "mm-a-t2", label: "Transformer", detail: "纯注意力架构，后来 GPT/BERT 的底座", kind: "term" },
            ] },
          ],
        },
        {
          id: "mm-attention-intro",
          sectionId: "intro",
          label: "引言",
          detail: "旧范式繁荣，但有结构性缺陷",
          kind: "section",
          children: [
            { id: "mm-a-i1", label: "RNN/LSTM/GRU 是当时序列任务的 SOTA", kind: "point" },
            { id: "mm-a-i2", label: "致命弱点：h_t 依赖 h_(t-1)，样本内无法并行", kind: "point" },
            { id: "mm-a-i3", label: "序列越长越致命，显存还限制批处理", kind: "point", children: [
              { id: "mm-a-t3", label: "隐藏状态", detail: "网络内部保存的记忆向量，外部看不见", kind: "term" },
            ] },
          ],
        },
        {
          id: "mm-attention-method",
          sectionId: "method",
          label: "方法",
          detail: "沿用编码器-解码器框架，替换内部部件",
          kind: "section",
          children: [
            { id: "mm-a-m1", label: "编码器把词序列变成连续表示 z", kind: "point" },
            { id: "mm-a-m2", label: "解码器自回归逐词生成输出", kind: "point" },
            { id: "mm-a-m3", label: "核心：多头自注意力 + 位置编码，一次看全场", kind: "point", children: [
              { id: "mm-a-t4", label: "多头自注意力", detail: "多个注意力头各看一类关系再合并", kind: "term" },
              { id: "mm-a-t5", label: "自回归", detail: "用已生成的词预测下一个词", kind: "term" },
            ] },
          ],
        },
        {
          id: "mm-attention-experiments",
          sectionId: "experiments",
          label: "实验结果",
          detail: "两个翻译任务 + 跨任务泛化",
          kind: "section",
          children: [
            { id: "mm-a-x1", label: "WMT14 En-De / En-Fr 双基准，结果可与前人同框比", kind: "point" },
            { id: "mm-a-x2", label: "8×P100 训练 3.5 天，成本远低于同级 SOTA", kind: "point" },
            { id: "mm-a-x3", label: "英语成分句法分析也拿下好结果，证明不止会翻译", kind: "point", children: [
              { id: "mm-a-t6", label: "SOTA", detail: "当前已发表方法里的最好成绩", kind: "term" },
            ] },
          ],
        },
        {
          id: "mm-attention-conclusion",
          sectionId: "conclusion",
          label: "结论",
          detail: "范式转变 + 未来展望",
          kind: "section",
          children: [
            { id: "mm-a-c1", label: "首个完全基于注意力的序列转导模型", kind: "point" },
            { id: "mm-a-c2", label: "计划扩展到图像/音频/视频等其他模态", kind: "point", children: [
              { id: "mm-a-t7", label: "模态", detail: "数据类型：文字/图像/音频/视频", kind: "term" },
            ] },
          ],
        },
      ],
    },
    fullText: [
      {
        heading: "Abstract",
        paragraphs: [
          "The dominant [[sequence transduction|seq-transduction]] models are based on complex [[recurrent|rnn]] or [[convolutional|convolution]] neural networks in an [[encoder-decoder|encoder]] configuration. The best performing models also connect the [[encoder|encoder]] and [[decoder|decoder]] through an [[attention mechanism|attention]]. We propose a novel network architecture, the [[Transformer|transformer]], which is based solely on [[attention mechanisms|attention]], dispensing with [[recurrence|recurrence]] and [[convolutions|convolution]] entirely.",
          "Experiments on two machine translation tasks show these models to be superior in quality while being more [[parallelizable|parallelizable]] and requiring significantly less time to train. Our model achieves 28.4 [[BLEU|bleu]] on the WMT 2014 English-to-German translation task, improving over the existing best results, including [[ensembles|ensemble]], by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model [[state-of-the-art|sota]] BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.",
        ],
      },
      {
        heading: "1 Introduction",
        paragraphs: [
          "[[Recurrent neural networks|rnn]], [[long short-term memory|lstm]] and [[gated recurrent neural networks|gru]] in particular, have been firmly established as the [[state of the art|sota]] in sequence modeling and transduction problems such as [[language modeling|language-modeling]] and machine translation. Numerous efforts have since continued to push the boundaries of these models.",
          "Recurrent models typically factor computation along the symbol positions of the input and output sequences. Stepping between positions, a model updates a [[state|hidden-state]] dependent on previously computed state and the input for its current position. This inherently sequential nature precludes [[parallelization|parallelizable]] within training examples, which becomes critical at longer sequence lengths, as memory constraints limit [[batching|batching]] across examples.",
          "The idea of [[attention|attention]] allows modeling of dependencies without regard to their distance in the input or output sequences, and has become a central and often successful component of [[encoder-decoder|encoder]] architectures. However, attention mechanisms are almost always used in conjunction with a [[recurrent model|rnn]]. In this work we propose the [[Transformer|transformer]], a model architecture eschewing [[recurrence|recurrence]] and instead relying entirely on an attention mechanism to draw global dependencies between input and output.",
        ],
      },
      {
        heading: "3 Model Architecture",
        paragraphs: [
          "Most competitive neural [[sequence transduction|seq-transduction]] models have an [[encoder-decoder|encoder]] structure. Here, the [[encoder|encoder]] maps an input sequence of symbol representations to a sequence of [[continuous representations|continuous-repr]] z, and the [[decoder|decoder]], given z, generates an output sequence of symbols one element at a time. At each step the model is [[auto-regressive|autoregressive]], consuming the previously generated symbols as additional input when generating the next.",
          "The [[Transformer|transformer]] follows this overall architecture using stacked [[self-attention|multi-head-attention]] and point-wise, fully connected layers for both the encoder and decoder. Self-attention is the operation used to compute a representation of a set of elements as a weighted combination of them, where the weight given to an element is computed by a function of the query and the corresponding key, and is normalized using the softmax.",
        ],
      },
      {
        heading: "8 Conclusion",
        paragraphs: [
          "In this work, we present the [[Transformer|transformer]], the first [[sequence transduction|seq-transduction]] model based entirely on [[attention|attention]], replacing the [[recurrent|recurrence]] layers most commonly used in encoder-decoder architectures with [[multi-headed self-attention|multi-head-attention]].",
          "For translation tasks, the [[Transformer|transformer]] can be trained significantly faster than architectures based on [[recurrent|rnn]] or [[convolutional|convolution]] layers. On both WMT 2014 English-to-German and WMT 2014 English-to-French translation tasks, we achieve a new [[state of the art|sota]]. We are interested in extending the Transformer to other types of input and output, such as images, audio, and video, and hope to encourage further work in this area.",
        ],
      },
    ],
  },
  {
    id: "dropout",
    title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting",
    titleZh: "Dropout：防止神经网络过拟合的简单方法",
    authors: "Srivastava et al.",
    venue: "JMLR 2014",
    year: 2014,
    url: "https://jmlr.org/papers/v15/srivastava14a.html",
    sourceNote: "内置示例 · 摘自 JMLR 公开版本，译文为预生成演示内容",
    sections: [
      {
        id: "abstract",
        title: "摘要",
        note: "这篇摘要展示了另一种经典结构：先夸 → 但是出问题 → 常规解法行不通 → 我的简单方法。",
        sentences: [
          {
            id: "d1",
            text: "Deep neural nets with a large number of parameters are very powerful machine learning systems.",
            translations: [
              "参数特别多的神经网络，就像装备超级齐全的厨房，什么菜（模式）都能做得出来。",
              "参数量巨大的深度神经网络是很强的机器学习系统，能拟合非常复杂的模式。",
              "大参数量的深度网络是强大的机器学习系统，表达能力强。",
              "开篇立前提：大参数深度网络表达能力强，这是它威力的来源，也是后面过拟合风险的来源。",
              "标准的「先扬后抑」开场。powerful 是为下一句 however 铺垫——表达能力和泛化风险是一体两面。",
            ],
            role: "先立深度网络的强大，为转折铺垫。",
            terms: [
              { id: "parameter", term: "参数", en: "parameter", explain: "网络里可以调节的「旋钮」（权重和偏置）。训练就是不断拧旋钮的过程。参数越多，能表达的模式越复杂，也越容易学过头。" },
            ],
          },
          {
            id: "d2",
            text: "However, overfitting is a serious problem in such networks.",
            translations: [
              "但这个厨房有个坏毛病：它把练过的菜谱背得滚瓜烂熟（连错别字都背），换个新菜谱就傻眼——这叫「死记硬背」（过拟合）。",
              "但这样的网络容易过拟合：把训练数据背得太好，连噪声都记住了，遇到新数据反而表现差。",
              "然而过拟合是大网络的严重问题：训练误差低，但泛化误差高。",
              "大参数网络存在严重过拟合风险：模型容量超过数据有效信息量，把噪声当信号拟合。",
              "however 引出核心问题。注意作者把过拟合定位为 serious problem 而非偶发现象，这决定了后面的解法必须通用、低成本。",
            ],
            role: "转折引出核心问题：过拟合。",
            terms: [
              { id: "overfitting", term: "过拟合", en: "overfitting", explain: "模型把训练数据「背下来了」而不是「学会了」：练习册全对，考试抓瞎。表现为训练效果好、新数据效果差。" },
              { id: "generalization", term: "泛化", en: "generalization", explain: "模型在没见过的新数据上的表现能力。机器学习的真正目标不是背题，是泛化。" },
            ],
          },
          {
            id: "d3",
            text: "Large networks are also slow to use, making it difficult to deal with overfitting by combining the predictions of many different large neural nets at test time.",
            translations: [
              "你可能想：多请几个厨房一起做菜再投票（集成），肯定更稳。但每个厨房都太慢，请一堆根本请不起。",
              "对付过拟合的经典办法是集成：让多个不同模型的预测取平均。但大网络推理太慢，测试时跑一堆模型不现实。",
              "大网络推理成本高，难以在测试阶段用多模型集成预测来缓解过拟合。",
              "集成是对抗过拟合的标准手段，但大网络的推理成本使测试时多模型平均不可行——这推动「在训练时获得集成效果」的思路。",
              "这句堵死了「朴素解法」，逼出训练阶段的创新。后面 dropout 可以理解为「隐式集成」，逻辑链非常紧凑。",
            ],
            role: "堵死朴素解法（测试时集成），逼出训练阶段的创新。",
            terms: [
              { id: "test-time", term: "测试阶段", en: "test time", explain: "模型训练完成后实际使用的阶段（也叫推理阶段）。训练时可以慢慢折腾，测试时要求快——很多方法只能放在训练阶段做。" },
            ],
          },
          {
            id: "d4",
            text: "Dropout is a technique for addressing this problem.",
            translations: [
              "于是作者想了个招叫「随机下班」（Dropout）：训练时随机让一部分厨师休息。",
              "Dropout 就是为解决这个问题提出的技术：训练时随机让一些神经元「下班」。",
              "Dropout 是针对上述问题提出的训练阶段正则化技术。",
              "本文提出 Dropout：一种训练期正则化技术，以几乎零额外推理成本近似集成效果。",
              "论点句极短，因为方法本身足够简单。简单方法的价值在于后面的机制解释（共适应、隐式集成）和大量实验支撑。",
            ],
            role: "主角登场：Dropout。",
            terms: [
              { id: "dropout", term: "随机失活", en: "Dropout", explain: "训练时每一步随机让一部分神经元「罢工」（输出置零），迫使网络不依赖任何单个神经元。测试时全员上岗。简单却极其有效，沿用至今。" },
              { id: "regularization", term: "正则化", en: "regularization", explain: "一切防止模型「学过头」（过拟合）的手段统称：给模型加约束、加噪声、减容量等。Dropout 是其中最有名的一种。" },
            ],
          },
          {
            id: "d5",
            text: "The key idea is to randomly drop units (along with their connections) from the neural network during training.",
            translations: [
              "招数具体是：每轮练习随机点一些厨师「这轮你休息」，连他们传菜的线也掐断。下一轮再随机换一批人休息。",
              "核心想法：训练时以一定概率随机移除一些神经元及其连接，每个批次看到的都是一个不同的「瘦身版」网络。",
              "训练时以一定概率随机丢弃单元及其连接，使每次更新都在训练一个不同的子网络。",
              "每个训练步以概率 p 独立丢弃单元（连同其输入输出连接），等价于从指数级数量的架构族中采样 thinned network 进行优化。",
              "注意随机性是「每步、独立」的——这是集成解释的来源。审稿人会关心 p 的取值、输入层是否也 drop、测试时的缩放约定（原始论文用权重缩放）。",
            ],
            role: "一句话说清机制：训练时随机丢弃神经元及其连接。",
            terms: [
              { id: "unit", term: "神经元单元", en: "unit", explain: "网络里的一个计算节点：接收若干输入、加权求和、过一个激活函数、输出一个数。一层由很多单元并排组成。" },
            ],
          },
          {
            id: "d6",
            text: "This prevents units from co-adapting too much.",
            translations: [
              "这样每个厨师都没法偷懒依赖某个固定搭档——因为搭档随时可能「下班」。人人都得学会独立干活，整个厨房反而更抗折腾。",
              "这能防止神经元之间「抱团」——过度依赖特定搭档——逼每个神经元学到更鲁棒、更独立的特征。",
              "Dropout 阻止单元间过度共适应，迫使网络学到更鲁棒的特征表示。",
              "通过打破单元间的共适应，dropout 鼓励分布式、冗余的表征，提升泛化——类似有性繁殖在进化中的作用（原文的类比）。",
              "co-adaptation 是论文的机制解释而非严格数学定理；作者同时给出「隐式模型平均」的解释。两种叙事互补，阅读时要分清「直觉解释」和「证明」。",
            ],
            role: "解释为什么有效：打破神经元之间的共适应。",
            terms: [
              { id: "co-adaptation", term: "共适应", en: "co-adaptation", explain: "几个神经元「抱团」：互相依赖着修正错误，形成脆弱的固定搭配。一旦某个缺席就集体失效。Dropout 随机拆散它们，逼每个都独立有用。" },
            ],
          },
        ],
      },
      {
        id: "intro",
        title: "引言",
        note: "引言的动机链：深度学习很成功 → 但过拟合严重 → 最强解法（集成）太贵 → 所以需要便宜的训练期正则化。跟着这条链读就不迷路。",
        sentences: [
          {
            id: "di1",
            text: "Deep learning has made possible many valuable applications, among them large-scale speech recognition, image recognition, and web search.",
            translations: [
              "深度学习已经很厉害了，语音助手认你说话、手机认出照片里的猫、搜索引擎给你排序，背后都有它。",
              "深度学习让很多有用的应用成为现实：大规模语音识别、图像识别、网页搜索排序等等。",
              "引言开场先肯定深度学习的成功：语音识别、图像识别、搜索等大规模应用都建立在它之上，为后文「但仍有过拟合」铺垫。",
              "以深度学习在语音/视觉/搜索的成功确立重要性，随即转入其瓶颈——过拟合，构成「先扬后抑」的论证结构。",
              "开场是领域共识陈述，无争议；作用是把读者拉到「问题重要」的语境，再自然引出正则化需求。",
            ],
            role: "引言第一步：确立深度学习的成功与重要性。",
            terms: [
              { id: "deep-learning", term: "深度学习", en: "deep learning", explain: "用很多层的神经网络来学习数据里的规律。层数深，能学到的模式就复杂，是过去十年 AI 进展的主力。" },
            ],
          },
          {
            id: "di2",
            text: "The success of deep learning has been built upon the availability of large-scale labelled data and powerful GPUs, but many deep learning models still suffer from overfitting.",
            translations: [
              "深度学习能这么火，靠的是海量带答案的练习题和超强显卡。但它有个老毛病：题刷得太熟，反而把「死记硬背」当成了「学会了」。",
              "深度学习的成功建立在大规模标注数据和强力 GPU 之上，但很多模型仍然会过拟合——训练集表现好，新数据就拉胯。",
              "点出深度学习的两大支柱（大数据 + 强算力）与其顽疾（过拟合）。这正是 Dropout 要解决的问题，是动机句。",
              "数据与算力驱动成功，但模型容量远超有效信息量导致过拟合风险；这一张力是正则化方法存在的根本理由。",
              "把过拟合定性为普遍且严重的问题，为后文提出通用、低成本的正则化方法建立必要性。",
            ],
            role: "引言转折：成功背后有过拟合顽疾，引出正则化需求。",
            terms: [
              { id: "labeled-data", term: "标注数据", en: "labelled data", explain: "带着「正确答案」的训练样本，比如标好「这是猫」的图片。监督学习靠它来学，但获取成本高、数量总不够，这也是过拟合的诱因之一。" },
            ],
          },
          {
            id: "di3",
            text: "The most powerful form of regularization is to train many separate models and average their predictions, but this is expensive both in training and in testing.",
            translations: [
              "对付「死记硬背」最狠的办法，是培养一大批不同的模型，让它们一起投票。可又费训练又费使用，太烧钱了。",
              "最强的正则化是「集成」：训练很多个独立模型，再把它们的预测取平均。但训练和测试都很贵，用不起。",
              "介绍集成的强大与昂贵，正是这一矛盾催生了 Dropout——在训练阶段近似集成效果，却几乎不增加测试成本。",
              "model averaging 是理论上最强的抗过拟合手段之一，但训练/推理成本翻倍；这为「隐式集成」的 dropout 提供了明确动机。",
              "这句堵死了朴素解法（测试时集成），逻辑上逼出训练期正则化；后文会把 dropout 解释为对指数级子网络的隐式平均。",
            ],
            role: "引言收束：堵死昂贵解法，逼出「训练时就生效的廉价正则化」。",
            terms: [
              { id: "model-averaging", term: "模型平均", en: "model averaging / ensembling", explain: "训练多个不同的模型，把它们的预测平均或投票，通常比单模型更稳更准。代价是训练和推理都要多份成本。" },
            ],
          },
        ],
      },
      {
        id: "method",
        title: "方法",
        note: "方法只看两个时刻：训练时怎么随机丢弃、测试时怎么缩放。把这两个动作对上，Dropout 就讲通了。",
        sentences: [
          {
            id: "dm1",
            text: "Dropout is a simple technique that can be applied to a wide variety of learning problems involving deep neural networks, and it significantly reduces overfitting and gives major improvements over other regularization methods.",
            translations: [
              "作者的招叫 Dropout：训练时随机让一部分「脑细胞」休息。方法简单，却比很多别的防过拟合招数都管用。",
              "Dropout 很简单：训练时随机关掉一些神经元。它适用于各种深度网络，能显著减少过拟合，效果常优于其他正则化方法。",
              "方法总述：Dropout 通用、简单、有效，跨多种深度学习问题显著抑制过拟合，相对其他正则化有明显提升。",
              "Dropout 作为训练期随机正则化，适用面广、实现简单，在多个基准上优于权重衰减等确定性正则化。",
              "「优于其他正则化」是较强断言，需靠后文跨领域实验支撑；审稿人会看对比是否公平（其他方法是否也充分调参）。",
            ],
            role: "方法部分开场：一句话交代 Dropout 的定位与优势。",
          },
          {
            id: "dm2",
            text: "At each training presentation, each hidden node is retained with probability p (typically 0.5) and dropped with probability 1 minus p, and the dropped nodes send no message and receive no message.",
            translations: [
              "具体规则：每练一轮，每个神经元都有大概一半概率被叫去「休息」。休息的人既不接收消息也不发消息，等于这轮暂时不存在。",
              "每次训练时，每个隐藏神经元以概率 p（常取 0.5）被保留、以 1−p 被丢弃；被丢弃的神经元这一步不接收也不输出任何信号。",
              "机制核心：逐样本、逐层独立地随机掩蔽神经元。每轮看到的都是不同的「瘦身子网络」，这正是隐式集成的来源。",
              "每步以 p 独立保留单元，被丢弃单元的前向消息与梯度都置零，等价于从共享权重的指数级子网络族中采样训练。",
              "关键细节：p 的取值、输入层是否也 drop、是否分层不同 p；这些超参显著影响效果，审稿人会要求报告敏感性分析。",
            ],
            role: "方法关键句：给出 Dropout 的精确随机规则（保留概率 p、丢弃即断连）。",
          },
          {
            id: "dm3",
            text: "At test time, the outputs of the hidden nodes are scaled by p so that the expected total input each node receives stays the same as during training, letting the network behave like a single averaged model rather than exponentially many.",
            translations: [
              "考试（测试）时所有人都得上班，不能请假。为了和练习时「一半人干活」的强度对上，把每个人的输出都乘以一个折扣，整体力度就一致了。",
              "测试时所有神经元都工作，但把输出按概率 p 缩放，使每个神经元收到的总信号和训练时的期望一致，从而相当于用一个「平均后的单一模型」。",
              "测试期的缩放是 Dropout 能工作的关键：保证训练/测试的激活期望一致，把指数级子网络的平均近似成一个确定性模型。",
              "test-time 对保留单元输出乘 p（原始论文用 weight scaling），匹配训练期期望，实现 thinned networks 的几何平均近似。",
              "缩放约定（激活缩放 vs 权重缩放、inverted dropout）是实现细节上的常见坑，做错会导致训练测试不一致；审稿人会核对具体约定。",
            ],
            role: "方法收尾：解释测试期如何缩放，把「很多子网络」变成「一个平均模型」。",
            terms: [
              { id: "test-time-scaling", term: "测试期缩放", en: "test-time scaling", explain: "训练时只有一部分神经元干活，测试时全部上岗，信号会偏强。把输出按保留概率 p 缩放，就能让两者强度一致。" },
            ],
          },
        ],
      },
      {
        id: "experiments",
        title: "实验",
        note: "实验看广度与硬指标：跨多少领域都有效、有没有拿下一个当时最好的数字。",
        sentences: [
          {
            id: "dx1",
            text: "Dropout improves performance on a wide range of tasks, including image classification, speech recognition, document classification, and learning vector representations for words.",
            translations: [
              "实验证明：认图片、听语音、分文档、给单词造「意思坐标」，加上 Dropout 后成绩普遍变好。",
              "Dropout 在很多任务上都提升效果：图像分类、语音识别、文档分类、词向量学习等等，说明它很通用。",
              "实验覆盖图像/语音/文本多领域，一致显示 Dropout 降低过拟合、提升泛化，支撑其「通用正则化」的定位。",
              "跨模态、跨任务的一致增益是论文说服力的核心：不是某个 trick 的局部胜利，而是通用正则化。",
              "广覆盖是优点；审稿人会看每个领域是否都做了与最强基线的公平对比，以及增益是否统计显著。",
            ],
            role: "实验总览：多领域一致提升，证明方法通用。",
          },
          {
            id: "dx2",
            text: "On the MNIST handwritten digit recognition task, combining dropout with the maxout network achieved a test error of 2.01 percent, the best published result on that benchmark at the time.",
            translations: [
              "在「手写数字识别」这道经典题上，Dropout 配上一种叫 maxout 的网络，错误率只有 2.01%，是当时发表过的最好成绩。",
              "在手写数字 MNIST 上，Dropout 结合 maxout 网络把测试错误率降到 2.01%，创下当时该基准已发表结果的最佳纪录。",
              "用一个具体硬数字坐实「有效」：MNIST 上 2.01% 错误率为当时 SOTA，Dropout 与 maxout 的组合威力可见。",
              "MNIST 2.01% test error（dropout+maxout）为当时已发表最佳；这类硬指标是论文说服社区的关键证据。",
              "「当时最佳」有时间性，需明确对比对象与年份；审稿人会核对是否在同一 split、同一协议下比较。",
            ],
            role: "实验亮点：用 MNIST 2.01% 的 SOTA 数字给出决定性证据。",
            terms: [
              { id: "mnist", term: "MNIST", en: "MNIST", explain: "手写数字识别的经典基准数据集（0-9 的图片）。长期以来是深度学习的「Hello World」，方便不同方法横向比较。" },
            ],
          },
        ],
      },
      {
        id: "conclusion",
        title: "结论",
        note: "结论给机制解释：把 Dropout 说成「隐式集成」，让前面所有实验串成一个道理。",
        sentences: [
          {
            id: "dk1",
            text: "Dropout can be understood as implicitly training a large ensemble of thinned networks that share weights, which explains why it captures many benefits of model averaging at only a small fraction of the cost.",
            translations: [
              "一句话总结：Dropout 其实是在偷偷训练一大堆「共用零件的迷你网络」并让它们投票，所以几乎不花额外成本，就拿到了集成的好处。",
              "可以把 Dropout 理解成：隐式地训练一大群共享权重的「瘦身网络」并平均它们，因此用极小代价获得模型集成的多数好处。",
              "结论给出机制层面的统一解释：Dropout 约等于共享权重的隐式集成，把「强大但昂贵的集成」变成「便宜且有效的正则化」。",
              "以「thinned networks 的隐式集成」统一解释共适应与正则两种叙事，点明其以极低成本逼近 model averaging 的本质。",
              "「隐式集成」是直觉性解释而非严格等价（子网络并不独立、共享权重）；审稿人会区分这是有用的类比还是可证明的结论。",
            ],
            role: "结论主句：把 Dropout 归为共享权重的隐式集成，收束全文机制解释。",
          },
        ],
      },
    ],
    mindmap: {
      id: "mm-dropout",
      label: "Dropout · 核心主张",
      detail: "训练时随机让神经元「下班」，以几乎零额外成本逼近模型集成的抗过拟合效果。",
      kind: "root",
      children: [
        {
          id: "mm-dropout-abstract",
          sectionId: "abstract",
          label: "摘要",
          detail: "先扬后抑：强大但过拟合 → 集成太贵 → Dropout 登场",
          kind: "section",
          children: [
            { id: "mm-d-a1", label: "大参数网络很强，但容易过拟合", kind: "point" },
            { id: "mm-d-a2", label: "测试时集成太慢，请不起", kind: "point" },
            { id: "mm-d-a3", label: "训练时随机丢弃单元，打破共适应", kind: "point", children: [
              { id: "mm-d-t1", label: "过拟合", detail: "把训练数据背下来而非学会，新数据抓瞎", kind: "term" },
              { id: "mm-d-t2", label: "共适应", detail: "神经元抱团依赖，一缺席就集体失效", kind: "term" },
            ] },
          ],
        },
        {
          id: "mm-dropout-intro",
          sectionId: "intro",
          label: "引言",
          detail: "动机链：成功 → 过拟合 → 集成太贵 → 需要便宜正则化",
          kind: "section",
          children: [
            { id: "mm-d-i1", label: "深度学习靠大数据 + 强算力崛起", kind: "point" },
            { id: "mm-d-i2", label: "最强正则化是多模型平均，但训练/测试都贵", kind: "point" },
            { id: "mm-d-i3", label: "于是需要训练阶段就生效的廉价正则化", kind: "point", children: [
              { id: "mm-d-t3", label: "正则化", detail: "一切防止模型学过头的手段统称", kind: "term" },
            ] },
          ],
        },
        {
          id: "mm-dropout-method",
          sectionId: "method",
          label: "方法",
          detail: "训练时随机丢弃，测试时按 p 缩放",
          kind: "section",
          children: [
            { id: "mm-d-m1", label: "每个隐藏节点以概率 p 保留（典型 0.5）", kind: "point" },
            { id: "mm-d-m2", label: "被丢弃节点这一步不收发任何消息", kind: "point" },
            { id: "mm-d-m3", label: "测试时输出乘 p，等价于指数级子网络的平均", kind: "point", children: [
              { id: "mm-d-t4", label: "测试期缩放", detail: "让训练与测试的激活期望保持一致", kind: "term" },
            ] },
          ],
        },
        {
          id: "mm-dropout-experiments",
          sectionId: "experiments",
          label: "实验",
          detail: "跨图像/语音/文本全面降过拟合",
          kind: "section",
          children: [
            { id: "mm-d-x1", label: "图像分类、语音识别、文档分类、词向量都受益", kind: "point" },
            { id: "mm-d-x2", label: "MNIST 上 dropout+maxout 达 2.01%，当时最佳", kind: "point", children: [
              { id: "mm-d-t5", label: "MNIST", detail: "手写数字识别的经典入门基准", kind: "term" },
            ] },
          ],
        },
        {
          id: "mm-dropout-conclusion",
          sectionId: "conclusion",
          label: "结论",
          detail: "可看作共享权重的隐式集成",
          kind: "section",
          children: [
            { id: "mm-d-c1", label: "隐式训练一大堆共享权重的瘦身网络并平均", kind: "point" },
            { id: "mm-d-c2", label: "以极小代价获得模型集成的多数好处", kind: "point", children: [
              { id: "mm-d-t6", label: "模型平均", detail: "多个模型预测取平均，更稳更准但更贵", kind: "term" },
            ] },
          ],
        },
      ],
    },
    fullText: [
      {
        heading: "Abstract",
        paragraphs: [
          "Deep neural nets with a large number of [[parameters|parameter]] are very powerful machine learning systems. However, [[overfitting|overfitting]] is a serious problem in such networks. Large training sets are available but are never enough, nor is the problem of deciding how many parameters to use to model a particular problem class adequately solved by existing methods.",
          "[[Dropout|dropout]] addresses these issues: during training, randomly dropping [[units|unit]], along with their learned connections, prevents them from excessively [[co-adapting|co-adaptation]]. Comparisons with previous state-of-the-art methods on several standard data sets show that dropout improves the performance of neural networks on supervised learning tasks in vision, speech recognition, document classification and computational biology, obtaining state-of-the-art results on many data sets.",
        ],
      },
      {
        heading: "1 Introduction",
        paragraphs: [
          "[[Deep learning|deep-learning]] algorithms have become very successful in the last few years, largely because of new architectures and fast GPUs that allow networks with many [[parameters|parameter]] to be trained on large datasets. When a deep network is trained on a limited number of examples it tends to [[overfit|overfitting]], and the most effective way to avoid overfitting is to train on more data, which is often unavailable.",
          "The most effective [[regularizer|regularization]] is [[model averaging|model-averaging]], but this requires training many separate models, which is expensive both to train and to evaluate. [[Dropout|dropout]] offers a cheaper alternative: it operates during training, randomly omitting [[units|unit]] so that no single unit can rely too heavily on the presence of particular other units.",
        ],
      },
      {
        heading: "2 Related Work",
        paragraphs: [
          "[[Dropout|dropout]] is most closely related to combining trained models by [[averaging|model-averaging]], which has been shown to help, and to using a mixture of experts. It also relates to bagging and to randomly allocating computational resources. Unlike those methods, dropout is applied to individual [[units|unit]] rather than whole models, and the sub-networks share their weights, so an exponential number of thin, highly specialized networks can be trained efficiently.",
        ],
      },
      {
        heading: "3 Dropout Learning",
        paragraphs: [
          "A [[dropout|dropout]] neural network is a standard feedforward neural network with the additional property that some of its [[units|unit]] are dropped out, that is, temporarily removed from the network with a probability p, typically 0.5. Dropping out a unit means that its activations are ignored, both when computing the forward function and when propagating errors backwards. At [[test time|test-time]] the output weights are [[scaled by p|test-time-scaling]] so that the expected total input to each unit matches what it saw during training.",
        ],
      },
      {
        heading: "8 Conclusion",
        paragraphs: [
          "[[Dropout|dropout]] can be viewed as training a large ensemble of thin, feedforward networks with a lot of shared weights, without the usual constraints needed to keep these networks independent. This gives most of the benefits of [[model averaging|model-averaging]] at a tiny fraction of the cost, and it can be applied to almost any model in which gradient-based learning can be used.",
        ],
      },
    ],
  },
];