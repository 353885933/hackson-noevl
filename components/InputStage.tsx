import React, { useState, useRef } from 'react';
import { IconCpu, IconPlay, IconBook } from './Icons';
import { AnalysisProgress } from '../types';

interface InputStageProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  progress?: AnalysisProgress | null;
}

export const InputStage: React.FC<InputStageProps> = ({ onAnalyze, isLoading, progress }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    onAnalyze(text);
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    // Simple mapping: OUTLINE: 0-20, CHUNKS: 20-60, ASSETS: 60-100
    if (progress.phase === 'OUTLINE') return 0 + (progress.current / progress.total) * 10;
    if (progress.phase === 'CHUNKS') return 10 + (progress.current / progress.total) * 40;
    if (progress.phase === 'ASSETS') return 50 + (progress.current / progress.total) * 40;
    if (progress.phase === 'PRELOADING') return 90 + (progress.current / progress.total) * 10;
    return 0;
  };

  const samples = {
    cyberpunk: `雨没有停。在新东京，雨已经下了三天三夜。
凯尔靠在小巷满是涂鸦的墙上，检查着他的义肢手臂。伺服电机发出轻微的嗡嗡声。
“你迟到了，”一个声音从阴影中传来。
是米拉。她走进了上方拉面店招牌投下的霓虹灯光中。她看起来和战前不同了。更冷酷，更坚硬。
“带来那个驱动器了吗？”她问道，伸出一只手。
凯尔犹豫了。他知道把数据给她意味着背叛公司，但留着它可能意味着死亡。
“我带了，”凯尔拍了拍口袋说。“但我需要知道你为什么要它。”
米拉叹了口气，抬头看着充满烟雾的天空。“因为这是拯救我们仅存之物的唯一方法，凯尔。公司不想让你知道，那个驱动器里装的不是什么商业机密，而是‘忒修斯计划’的源代码。”
“忒修斯？”凯尔的义眼缩放了一下，他在記憶库里搜索着这个词。“那个所谓的人格备份项目？我以为那只是传说。”
“不是传说。他们打算把所有底层平民的意识上传到云端，然后销毁肉体以节省资源。”米拉的声音在雷声中显得格外冰冷，“而那个驱动器，是切断上传通道的唯一钥匙。”
凯尔感觉口袋里的金属块变得滚烫。这不仅仅是一份数据，这是数百万条生命。
就在这时，巷口传来了沉重的机械脚步声。两台“猎犬”型安保无人机闪烁着红色的红外扫描仪，正在逼近。
“看来他们不想让我们闲聊了。”凯尔苦笑一声，左臂的义肢弹出单分子利刃，蓝色的电弧在雨水中跳跃。
米拉扔掉了湿透的烟卷，拔出了腰间的电磁手枪：“还是老规矩？我负责制造混乱，你负责突围？”
凯尔看向她，那一刻仿佛回到了战前的旧时光。“不，这次我们一起冲出去。”`,

    historical: `大雪纷飞，长安城的朱雀大街上空无一人。
李白提着一壶酒，歪歪斜斜地走在雪地上，每一步都留下深深的脚印。他的衣衫单薄，却似感觉不到寒冷。
“太白兄，留步。”
身后传来温润的声音。李白回过头，只见王维撑着一把油纸伞，立在风雪中，神色如玉。
“摩诘？”李白仰头灌了一口酒，大笑道，“你也来笑话我落魄至此吗？”
王维摇了摇头，走上前，将伞遮在李白头上。“非也。陛下召你入宫写诗，你却抗旨不遵，我是来为你送行的。”
“送行？”李白眯起眼睛，“送我去哪？天牢么？”
“送你去江湖。”王维叹息，从袖中取出一封通关文牒，“这是我为你求来的。出了城，便无人再能拘束你这只大鹏
李白愣住了。他看着王维那双清澈的眼睛，酒意醒了大半。
“为何帮我？”
“因为你的诗，属于山川湖海，不属于金銮殿。”王维淡淡一笑，转身离去，只留下一把伞和那个孤寂的背影。
李白握着那还带着温度的文牒，望着漫天大雪，忽然泪流满面。`,

    lotm: `第一章 绯红
痛！
好痛！
头好痛！
光怪陆离满是低语的梦境迅速支离破碎，熟睡中的周明瑞只觉脑袋抽痛异常，仿佛被人用棒子狠狠抡了一下，不，更像是遭尖锐的物品刺入太阳穴并伴随有搅动！
嘶……迷迷糊糊间，周明瑞想要翻身，想要捂头，想要坐起，可完全无法挪动手脚，身体似乎失去了控制。
看来我还没有真醒，还在梦里……等下说不定还会出现自以为已经醒了，实际依然在睡的情况……对类似遭遇不算陌生的周明瑞竭力集中意志，以彻底摆脱黑暗和迷幻的桎梏。
然而，半睡半醒之时，意志总是飘忽如同烟雾，难以控制，难以收束，他再怎么努力，依旧忍不住思维发散，杂念浮现。
好端端的，大半夜的，怎么会突然头痛？
还痛得这么厉害！
不会是脑溢血什么的吧？
我擦，我不会就这样英年早逝了吧？
赶紧醒！赶紧醒！
咦，好像没刚才那么痛了？但脑子里还是跟有把钝刀子在慢慢割一样……
看来没法继续睡了，明天还怎么上班？
还想什么上班？有货真价实的头痛，当然是请假啊！不用怕经理罗里吧嗦！
这么一想，好像也不坏啊，嘿嘿，偷得浮生半日闲！
一阵又一阵的抽痛让周明瑞点滴积累起虚幻的力量，终于，他一鼓作气地挺动腰背睁开眼睛，彻底摆脱了半睡半醒的状态。
视线先是模糊，继而蒙上了淡淡的绯红，目光所及，周明瑞看见面前是一张原木色泽的书桌，正中央放着一本摊开的笔记，纸张粗糙而泛黄，抬头用奇怪的字母文字书写着一句话语，墨迹深黑，醒目欲滴。
笔记本左侧靠桌子边缘，有一叠整整齐齐的书册，大概七八本的样子，它们右手边的墙上镶嵌着灰白色的管道和与管道连通的壁灯。
这盏灯很有西方古典风味，约成年人半个脑袋大小，内层是透明的玻璃，外面用黑色金属围出了栅格。
熄灭的壁灯的斜下方，一个黑色墨水瓶笼罩着淡红色的光华，表面的浮凸构成了模糊的天使图案。
墨水瓶之前，笔记本右侧，一根肚腹圆润的深色钢笔静静安放，笔尖闪烁着微光，笔帽搁于一把泛着黄铜色泽的左轮手枪旁边。
手枪？左轮？周明瑞整个人都愣住了，眼前所见的事物是如此陌生，与自己房间没半点相像之处！
惊愕茫然的同时，他发现书桌、笔记本、墨水瓶、左轮手枪都蒙着一层绯红的“轻纱”，那是窗外照进来的光辉。
下意识间，他抬起脑袋，视线一点点上移：
半空之中，黑色“天鹅绒幕布”之上，一轮赤红色的满月高高悬挂，宁静照耀。
这……周明瑞惶恐莫名，猛地站起，可双腿还未完全打直，脑袋又是一阵抽痛，这让他短暂失去力量，重心不由自主下坠，屁股狠狠地撞击在了硬木所制的椅面上。
啪！
疼痛未能造成影响，周明瑞以手按桌，重又站起，慌乱地转过身体，打量自身所处的环境。
这是个不大的房间，左右两侧各有一扇棕门，紧挨对面墙壁的是张木制高低床。
它与左门之间放着个橱柜，上面对开，下方是五个抽屉。
橱柜边缘，一人高的位置，同样有灰白色管道镶嵌于墙上，但它连通的是个奇怪的机械装置，少许地方裸露着齿轮和轴承。
近书桌的右墙角堆放着类似煤炭炉的事物，以及汤锅、铁锅等厨房用具。
越过右门是一扇有两道裂纹的穿衣镜，木制底座的花纹简单而朴素。
目光一扫，周明瑞隐隐约约看见了镜中的自己，现在的自己：
黑发，褐瞳，亚麻衬衣，体型单薄，五官普通，轮廓较深……
这……周明瑞顿时倒吸了口凉气，心头涌现出诸多无助又凌乱的猜测。
左轮手枪，欧美古典风味布置，以及那轮与地球迥异的绯红之月，无一不在说明着某件事件！
我，我不会穿越了吧？周明瑞嘴巴一点点张开。
他看网文长大，对此常有幻想，可当真正遇到，一时却难以接受。
这大概就是所谓的叶公好龙吧？过了几十秒，周明瑞苦中作乐地自我吐槽了一句。
若非脑袋的疼痛依旧存在，让思维变得紧绷而清晰，他肯定会怀疑自己在做梦。
平静，平静，平静……深呼吸了几下，周明瑞努力让自身不要那么慌乱。
就在这时，随着他身心的调和，一个个记忆片段突兀跳出，缓慢呈现于他的脑海之中！
父亲是皇家陆军上士，牺牲于南大陆的殖民冲突，换来的抚恤金让克莱恩有了进入私立文法学校读书的机会，奠定了他考入大学的基础……
母亲是黑夜女神信徒，在克莱恩通过霍伊大学入学考试那年过世……
还有一个哥哥，一个妹妹，共同住在公寓的两居室内……
作为历史系毕业生，克莱恩掌握了号称北大陆诸国文字源头的古弗萨克语，以及古代陵寝里经常出现，与祭祀、祈祷相关的赫密斯文……
赫密斯文？周明瑞心头一动，伸手按住抽痛的太阳穴，将视线投向了书桌上摊开的那本笔记，只觉泛黄纸张上的那行文字从奇怪变得陌生，从陌生变得熟悉，从熟悉变得可以解读。
这是用赫密斯文书写的话语！
那深黑欲滴的墨迹如是说：
“所有人都会死，包括我。”
嘶！周明瑞莫名惊恐，身体本能后仰，试图与笔记本，与这行文字拉开距离。
他很是虚弱，险些跌倒，慌忙伸手按住桌缘，只觉四周的空气都变得躁动，耳畔隐约有细密的呢喃在回荡，有种小时候听长辈讲恐怖故事的感受。
摇了下头，一切只是幻觉，周明瑞重新站稳，将目光从笔记本上移开，大口喘起了气。
这时，他的视线落在了那把闪烁黄铜光泽的左轮手枪处，心头霍然冒出了一个疑问。
“以克莱恩的家境，哪有钱和渠道买手枪？”周明瑞不由皱起了眉头。
沉思之中，他忽然发现书桌边缘多了半个红色手印，色泽比月华更深，比“轻纱”更厚。
那是血手印！
“血手印？”周明瑞下意识翻开了刚才按住桌缘的右手，低头一瞧，只见掌心和手指满是血污。
与此同时，他脑袋的抽痛依旧传来，略微减弱，连绵不绝。
“不会磕破头了吧？”周明瑞边猜想边转过身体，走向那面有裂纹的穿衣镜。
几步之后，中等身材，黑发褐瞳，有着明显书卷气的身影清晰映入了他的眼帘。
这就是现在的我，克莱恩·莫雷蒂？
就着轻纱般的绯红月光，他侧过脑袋，查看额角的情况。
清晰倒映的镜子如实呈现，一个狰狞的伤口盘踞在他的太阳穴位置，边缘是烧灼的痕迹，周围沾满了血污，而内里有灰白色的脑浆在缓缓蠕动。


第二章 情况
蹬蹬蹬！
周明瑞被眼前的景象吓得连退了几步，似乎穿衣镜中的不是自己，而是一具干尸。
拥有这么严重伤口的人怎么可能还活着！
他不敢相信般又侧过脑袋，检查另外一面，哪怕距离拉长，光线模糊，依旧能看出贯穿伤口和深红血污的存在。
“这……”
周明瑞吸了口气，努力让自己平静。
他伸手按往左边胸口，感受到了心脏剧烈快速又生机勃勃的跳动。
又摸了摸裸露在外的皮肤，些微的冰凉掩盖下是温热的流淌。
往下一蹲，验证膝盖还能弯曲之后，周明瑞重又站起，不再那么慌乱。
“怎么回事？”他皱眉低语，打算再认真检查一遍头部的伤口。
往前走了两步，他忽然又停顿下来，因为窗外血月的光芒相对黯淡，不足以支撑“认真检查”这件事情。
一个记忆的碎片应激而出，周明瑞转头看向了书桌紧挨着的那面墙壁上的灰白管道和金属栅格包围成的壁灯。
这是当前主流的煤气灯，焰火稳定，照明效果极佳。
本来以克莱恩·莫雷蒂的家庭情况，别说煤气灯，连煤油灯都不该奢望，使用蜡烛才是符合身份和地位的表现，但四年前，他熬夜读书，为霍伊大学入学考试而奋斗时，哥哥班森认为这是关系家庭未来的重要事情，哪怕借债也要为他创造良好的条件。
当然，识字又工作了好几年的班森绝对不是鲁莽的、缺乏手段的、不考虑后果的人，他以“安装煤气管道有利于提高公寓的档次，有助于将来的出租”为理由忽悠得房东先生掏钱完成了基础改造，自己则借助于供职进出口公司的便利，拿到了近乎成本价的新型煤气灯，前前后后竟然只用了积蓄，没有找人借钱。
碎片闪烁而过，周明瑞回到书桌前，打开管道阀门，扭动煤气灯开关。
哒哒哒，摩擦点火之声连响，光明却没有如同周明瑞预料一样降临。
哒哒哒！他又扭动了几下，可煤气灯依旧黯淡。
“嗯……”收回手，按住左侧太阳穴，周明瑞榨取起记忆碎片，寻找事情缘由。
过了几秒，他转过身体，走向大门旁边，来到了同样镶嵌在墙上，同样有灰白管道连接的机械装置前。
这是瓦斯计费器！
看了眼裸露少许的齿轮和轴承，周明瑞从裤袋里掏出了一个硬币。

让手中这枚国王乔治三世登基时才发行的铜便士在指尖翻动了几圈后，周明瑞捻着它，塞入了瓦斯计费器竖直张开的细长“嘴巴”里。
叮叮当当！
随着便士在计费器内部的跌落到底，喀嚓喀嚓的齿轮转动声随即响起，奏出了短小而美妙的机械旋律。
周明瑞凝视几秒，重又回到原木色书桌前，伸手扭动煤气灯的开关。
哒哒哒，啪！
一丛火苗燃起，迅速变大，明亮的光线先是占据了壁灯内部，接着穿过透明的玻璃，将房间蒙上了温馨的色彩。
黑暗骤然缩离，绯红退出了窗户，周明瑞莫名安心了几分，快步来到穿衣镜前。
这一次，他认真审视着太阳穴位置，不放过一点细节。
几经比较，他发现除开最初的血污，狰狞的伤口并没有再流出液体，像是得到了最好的止血和包扎，而那缓缓蠕动的灰白大脑和以肉眼可见速度生长的创口血肉在昭示着愈合的到来，也许三四十分钟，也许两三个小时，那里将只剩下“穿越带来的治疗效果？”周明瑞翘了下右边嘴角，无声低语。
定了定心神，他拉动抽屉，拿出小块肥皂，从橱柜旁边挂着的破旧毛巾里取下了其中一条，然后打开大门，走向二楼租客公用的盥洗室。
嗯，头上的血污得处理一下，免得总是一幅案发现场的模样，吓到自己不要紧，要是吓到了明天得早起的妹妹梅丽莎，那事情就不好收场了！
门外的走廊一片黑暗，只有尽头窗户洒入的绯红月光勉强勾勒着凸出事物的轮廓，让它们像是深沉夜里默默注视着活人的一双双怪物眼睛。
周明瑞放轻脚步，颇有点心惊胆战地走向盥洗室。
进了里面，月光更盛，一切清楚了起来，周明瑞站到洗漱台前，拧开了自来水龙头。
哗啦啦，水声入耳，他霍然想到了房东弗兰奇先生。
因为水费包含在房租内，这位头顶礼帽、内穿马甲、外套黑色正装、矮小又瘦削的先生总是积极地前来巡视几个盥洗室，偷听里面流水的声音。
如果哗啦的动静较大，那弗兰奇先生就会不顾绅士风度，凶猛地挥舞手杖，击打盥洗室之门，大声嚷嚷“该死的小偷！”“浪费是可耻的事情！”“我记住你了！”“再让我看见一次，就带上你肮脏的行李滚出去！”“相信我，这是全廷根市最划算的公寓，你再也找不到比我更慷慨的房东了！”
收回思绪，周明瑞打湿毛巾，清洗起脸上的血污，一遍又一遍。
等到照过盥洗室破破烂烂的镜子，确认只剩下狰狞的伤口和苍白的脸庞，周明瑞一下轻松了不少，然后脱掉亚麻衬衣，借助肥皂搓揉沾上的血点。
就在这个时候，他眉头一皱，想起或许还有别的麻烦：
伤口夸张，血污众多，除开自己身上，房间内应该还有痕迹！
过了几分钟，周明瑞处理好亚麻衬衣，拿着湿毛巾快步回到家里，先擦了书桌上的血手印，然后依靠煤气灯的光芒，寻找别的残留。
这一找，他立刻发现地板上和书桌底部有不少飞溅出的血点，而左手墙边，还有枚黄澄澄的子弹头。
“……用左轮抵住太阳穴开了一枪？”前后线索霍然贯通，周明瑞大概明白克莱恩的死因了。
他没急着验证，而是先认认真真擦掉了血痕，处理了“现场”，接着才带上弹头，回到书桌旁，将手枪转轮往左打开，倒出了里面的子弹。
啪啪啪，一共五枚子弹，一个弹壳，皆流动着黄铜光泽。
“果然……”周明瑞看了眼那空弹壳，一边将子弹挨个塞回转轮，一边微微点头。
他视线左移，望向摊开笔记本上书写的那句“所有人都会死，包括我”，心里跟随涌现出更多的疑惑。
枪哪里来的？
自杀，还是伪装成自杀？
一个平民出生的历史系毕业生能惹上什么事情？
这种自杀方式怎么才留下这点血痕？是因为我穿越及时，自带治愈福利？
沉吟片刻，周明瑞换上另一件亚麻衬衣，坐到椅子上，思考起更加重要的事情。
克莱恩的遭遇目前还不是自己关心的重点，真正的问题在于弄清楚为什么会穿越，能不能再穿回去！
父母、亲戚、死党、朋友、丰富多彩的网络世界、各种各样的美食……这都是想要回去的迫切心情！
啪，啪，啪……周明瑞的右手无意识地甩出手枪转轮，又将它收拢回去，一次又一次。
“嗯，这段时间和以往没太大差别啊，就是倒霉了一点，怎么会莫名其妙就穿越了？”
“倒霉……对了，我今天晚上吃饭前做了个转运仪式！”
一道闪电划过周明瑞的脑海，照亮了他被迷雾所遮掩的记忆。
作为一名合格的键盘政治家、键盘历史学家、键盘经济学家、键盘生物学家、键盘民俗学家，自己一向号称“什么都而方术便是其中之一。
去年回老家，在旧书摊上发现了一本线装竖版的“秦汉秘传方术纪要”，看着挺有趣的样子，觉得有助于在网上装逼，于是就买了回去，可惜，兴趣来得快，去得也快，竖版让人阅读感很差，自己只翻了个开头，就把书丢到角落里去了。
等到最近一个月连续倒霉，丢手机，客户跑路，工作失误，不好的事情轮着到来，才偶然想起“方术纪要”开头有个转运仪式，而且要求极其简单，不用任何基础：
只需将所在地区的主食弄四份，放到房间四个角落，这可以在桌上、柜子上等地方，然后站到房间中央，用四步逆时针走出一个正方形，第一步诚心默念“福生玄黄仙尊”，第二步默念“福生玄黄天君”，第三步默念“福生玄黄上帝”，第四步默念“福生玄黄天尊”，走完之后，闭上眼睛，原地等待五分钟，仪式就算成功。
抱着反正不要钱的心态，自己翻出那本书，照着要求，在晚饭前做了一遍，然而，然而，当时什么都没有发生。谁知，到了半夜，自己竟然穿越了！
穿越了！
“有一定可能是那个转运仪式……嗯，明天在这里试一试，如果真是因为它，那我就有希望穿回去了！”周明瑞停下抖甩左轮手枪的动作，猛地坐直了身体。
不管怎么样，自己都要试一试！
死马也得当成活马医！
`,

    odyssey: `缪斯啊，请为我讲述那位足智多谋的英雄，他在攻陷神圣的特洛伊城后，长久漂泊。他走遍许多城邦，了解了各地的风俗习惯；他在海上饱受磨难，为保全自己的性命，设法让同伴们平安返乡。然而尽管他竭尽全力，也未能救回他的伙伴们——他们因自己的愚蠢而丧命，吃了太阳神赫利俄斯的圣牛，神明因此剥夺了他们回家的机会。宙斯的女儿啊，请从任何一处开始，为我们讲述这些故事。那时，所有在战场上和海上幸存的人都已安全返乡，唯独奥德修斯，尽管他渴望回到妻子和祖国的怀抱，却被女神卡吕普索困在她的深邃洞穴中，她想要他成为自己的丈夫。
    
    岁月流逝，众神终于决定让他返回伊塔卡；然而即便回到故土，回到亲人身边，他的磨难仍未结束。所有的神明都对他心生怜悯，唯独波塞冬始终不依不饶，直到这位神一般的英雄终于踏上故乡的土地。
    
    但此刻，波塞冬正在远方的埃塞俄比亚人中间——埃塞俄比亚人分居天涯海角，一部分在日落之地，一部分在日出之处——他在那里接受盛大的百牲祭。波塞冬坐在宴席上享受祭品，而其他众神则聚集在奥林匹斯山上宙斯的宫殿中。
    
    云集者之父首先开口说话，他心中想着高贵的埃癸斯托斯，那个被阿伽门农光荣的儿子俄瑞斯忒斯所杀的人。"可耻啊——我说！凡人责怪我等众神，说我们给了他们苦难，然而事实却并非这样：他们以自己的粗莽，逾越既定的规限，替自己招致悲伤，一如不久前埃吉索斯的作为，越出既定的规限，姘居阿特柔斯之子婚娶的妻房，将他杀死，在他返家之时，尽管埃吉索斯知晓此事会招来突暴的祸殃——我们曾明告于他，派出赫耳墨斯，眼睛雪亮的阿耳吉丰忒斯，叫他不要杀人，也不要强占他的妻房：俄瑞斯忒斯会报仇雪恨，为阿特桑斯之子，一经长大成人，思盼回返故乡。赫耳墨斯曾如此告说，但尽管心怀善意，却不能使埃吉索斯回头；现在，此人已付出昂贵的代价。"”
    
    听罢这番话，灰眼睛女神雅典娜答道：“克罗诺斯之子，我的父亲，最高贵的王者，埃吉索斯确实祸咎自取，活该被杀，任何重蹈覆辙的凡人，都该遭受此般下场。然而，我的心灵正为聪颖的俄底修斯煎痛，可怜的人，至今远离亲朋，承受悲愁的折磨，陷身水浪拥围的海岛，大洋的脐眼，一位女神的家园，一个林木葱郁的地方。她是歹毒的阿特拉斯的女儿，其父知晓洋流的每一处深底，撑顶着粗浑的长柱，隔连着天空和大地。正是他的女儿滞留了那个愁容满面的不幸之人，总用甜柔、赞褒的言词迷蒙他的心肠，使之忘却伊萨卡，但俄底修斯一心企望眺见家乡的炊烟，盼愿死亡。然而你，俄林波斯大神，你却不曾把他放在心上。道俄底修斯不曾愉悦你的心房，在阿耳吉维人的船边，宽阔的特洛伊平野？为何如此无情，对他狠酷这般？”
”`
  };

  const loadSample = (type: keyof typeof samples) => {
    setText(samples[type]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setText(content);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 md:p-8 animate-slide-up grid-bg relative">
      {/* Container simulating a device chassis */}
      <div className="w-full max-w-3xl bg-concrete border-2 border-ink shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] hover:shadow-[0_0_20px_rgba(255,51,0,0.15)] transition-shadow duration-500 relative overflow-hidden group">


        {/* Decorative Tech Corners */}
        <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-ink/40 pointer-events-none" />
        <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-ink/40 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-ink/40 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-ink/40 pointer-events-none" />

        {/* Header Strip */}
        <div className="bg-ink text-paper p-4 flex justify-between items-center border-b-2 border-ink relative">
          <h1 className="font-serif text-3xl font-black tracking-tighter uppercase italic">
            Narrative<span className="text-signal">Engine</span> <span className="text-lg not-italic text-paper/60 ml-2">/ 叙事引擎</span>
            <span className="inline-block w-3 h-6 bg-signal ml-2 animate-flicker align-middle"></span>
          </h1>
          <div className="font-mono text-xs opacity-60">
            V 2.0.4 [稳定版]
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-10 flex flex-col gap-6">

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end mb-2">
              <label className="font-mono text-xs uppercase tracking-widest text-ink/60 font-bold">输入源 // 小说文本</label>
              <input
                type="file"
                accept=".txt,.md,.json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={triggerFileUpload}
                disabled={isLoading}
                className="font-mono text-xs bg-ink/10 hover:bg-ink hover:text-paper px-3 py-1 transition-colors uppercase flex items-center gap-2"
              >
                <IconBook className="w-3 h-3" />
                上传文件 (.txt)
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              className="w-full h-64 bg-paper border-2 border-ink p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-signal focus:border-signal resize-none placeholder-ink/30"
              placeholder="在此粘贴你的故事片段、小说章节，或上传文本文件..."
            />
          </div>

          <div className="flex flex-col gap-6 border-t-2 border-ink/10 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">

              {/* Sample Buttons */}
              <div className="flex flex-col gap-1 items-start">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40 font-bold">加载示例 // Load Preset</span>
                <div className="flex gap-2">
                  <button onClick={() => loadSample('cyberpunk')} disabled={isLoading} className="font-mono text-xs border border-ink/20 px-3 py-2 hover:bg-ink hover:text-paper transition-colors flex items-center gap-2 group">
                    <svg className="w-3 h-3 text-ink/40 group-hover:text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    赛博朋克
                  </button>
                  <button onClick={() => loadSample('lotm')} disabled={isLoading} className="font-mono text-xs border border-ink/20 px-3 py-2 hover:bg-ink hover:text-paper transition-colors flex items-center gap-2 group">
                    <svg className="w-3 h-3 text-ink/40 group-hover:text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7h-9m1 0a2 2 0 100-4 2 2 0 000 4zm-8 4h12M4 11h2M4 15h2m2 0h12m-2 4h-8" /></svg>
                    诡秘之主
                  </button>
                  <button onClick={() => loadSample('odyssey')} disabled={isLoading} className="font-mono text-xs border border-ink/20 px-3 py-2 hover:bg-ink hover:text-paper transition-colors flex items-center gap-2 group">
                    <svg className="w-3 h-3 text-ink/40 group-hover:text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    奥德赛
                  </button>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !text.trim()}
                className={`
                  group relative px-8 py-3 bg-ink text-paper font-bold font-sans uppercase tracking-wider
                  border-2 border-transparent hover:bg-signal hover:text-ink transition-all duration-200
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                  flex items-center gap-3 overflow-hidden min-w-[180px]
                `}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin"><IconCpu /></span>
                    <span>转化中...</span>
                  </>
                ) : (
                  <>
                    <span>启动游戏</span>
                    <IconPlay className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Granular Progress UI */}
            {isLoading && (
              <div className="w-full bg-ink/5 p-4 border border-ink/10 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signal font-bold">
                    System Pipeline Status
                  </span>
                  <span className="font-mono text-[10px] text-ink/40">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full h-2 bg-paper border border-ink/20 overflow-hidden relative">
                  <div
                    className="h-full bg-signal transition-all duration-500 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                  {/* Scanning line effect */}
                  <div className="absolute top-0 bottom-0 w-8 bg-white/20 -skew-x-12 animate-scan" style={{ left: `${getProgressPercentage() - 5}%` }} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse" />
                  <p className="font-mono text-[11px] text-ink/80 italic">
                    {progress?.message || "正在初始化系统..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative elements - Saul Bass style jagged lines */}
        <div className="absolute top-0 right-10 w-4 h-full bg-ink/5 -skew-x-12 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-8 h-32 bg-signal/10 skew-x-12 pointer-events-none"></div>
      </div>

      {/* Footer Meta */}
      <div className="mt-8 font-mono text-xs text-ink/40 text-center uppercase tracking-widest">
        LSP Pipeline V2.0 // Powered by Aliyun DashScope
      </div>
    </div>
  );
};