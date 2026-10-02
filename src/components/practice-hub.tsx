import Link from "next/link";
import { ArrowLeft, AudioWaveform, Bot, BriefcaseBusiness, FilePenLine, GitBranch, GraduationCap, Headphones, Languages, LibraryBig, Mic2, Network, NotebookTabs, Sparkles } from "lucide-react";
import { ContextAppropriatenessQuiz } from "./context-appropriateness-quiz";

const labs = [
  {href:"/practice/collocations",icon:Network,title:"شبكات التراكيب",de:"Kontext · Verbindung · Transfer",copy:"ست عشرة شبكة تربط الكلمة بأفعالها وسياقاتها، ثم تختبر المقصد بدل حفظ مرادفات معزولة.",status:"48 تركيبًا"},
  {href:"/practice/conversation-paths",icon:GitBranch,title:"مسارات المحادثة",de:"Verstehen · Entscheiden · Reparieren",copy:"ثمانية مواقف متفرعة دون AI؛ اختر ردًا، شاهد أثره، ثم أكمل الهدف أو أصلح المسار.",status:"8 سيناريوهات"},
  {href:"/practice/dictation",icon:Headphones,title:"مختبر الإملاء المتكيف",de:"Hören · Schreiben · Vergleichen",copy:"إملاء جزئي للمبتدئ يتدرج إلى جمل كاملة، مع مقارنة موضعية وإعادة بلا عقوبة.",status:"16 مهمة"},
  {href:"/practice/practical-day",icon:BriefcaseBusiness,title:"اليوم العملي",de:"Wohnen · Arbeit · Verwaltung",copy:"سيناريو مترابط من أربع خطوات للسكن أو العمل أو الإدارة مع حدود قانونية صريحة.",status:"3 سيناريوهات"},
  {href:"/writing",icon:FilePenLine,title:"مختبر الكتابة",de:"Schreiben",copy:"مسودة، فحص، ملاحظات، ثم نسخة منقحة محفوظة محليًا.",status:"يعمل"},
  {href:"/speaking",icon:Mic2,title:"مختبر المحادثة",de:"Sprechen",copy:"سجّل صوتك محليًا، استمع، قيّم نفسك، ثم أعد المحاولة.",status:"يعمل"},
  {href:"/mediation",icon:Languages,title:"مختبر الوساطة",de:"Mediation",copy:"فكّ المصدر، انقل المقصد والقيود للمتلقي، ثم راجع وأعد الصياغة.",status:"84 مهمة"},
  {href:"/shadowing",icon:AudioWaveform,title:"مختبر التقليد الصوتي",de:"Shadowing",copy:"استمع إلى ملف MP3، غيّر السرعة، أخفِ النص، ثم سجّل مقارنة ذاتية محلية.",status:"80 ملفًا"},
  {href:"/library",icon:LibraryBig,title:"المكتبة الموسعة",de:"Lesen & Hören",copy:"نصوص مستقلة عبر المستويات مع أسئلة واستراتيجيات فهم.",status:"160 مادة"},
  {href:"/errors",icon:NotebookTabs,title:"دفتر الأخطاء",de:"Fehlerheft",copy:"أنماط أخطائك، المصائد العربية، والعيادات العلاجية.",status:"يعمل"},
  {href:"/tutor",icon:Bot,title:"المرشد الذكي",de:"Tutor",copy:"شرح مرتبط بالمنهج مع وضع محلي أو مزود اختياري.",status:"يعمل"},
  {href:"/exams",icon:GraduationCap,title:"مركز الامتحان",de:"Prüfung",copy:"افصل Goethe عن telc وتدرّب على أجزاء أصلية موثقة الصيغة.",status:"ملفان موثقان"},
];
export function PracticeHub(){return <div className="wide-page"><header className="page-heading"><div><span className="eyebrow"><Sparkles size={15}/> مختبرات المهارة</span><h1>حوّل المعرفة إلى <em>أداء.</em></h1><p>الاختيارات وحدها لا تكفي. هنا تنتج اللغة، ترى أخطاءك، وتعيد المحاولة.</p></div></header><ContextAppropriatenessQuiz/><div className="hub-grid">{labs.map(({href,icon:Icon,title,de,copy,status})=><Link href={href} key={href} className="hub-card"><span><Icon size={23}/></span><small>{status}</small><h2>{title}</h2><strong lang="de" dir="ltr">{de}</strong><p>{copy}</p><footer>افتح المختبر <ArrowLeft size={16}/></footer></Link>)}</div></div>}
