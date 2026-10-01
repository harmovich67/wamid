// Starter curriculum for Wameed (Arabic). Used by prisma/seed.js.
// Blocks: text | code | callout — videos/images can be added from the lesson editor.

let n = 0;
const id = () => `b${++n}`;
const T = (markdown) => ({ id: id(), type: "text", markdown });
const C = (language, code, title = null) => ({ id: id(), type: "code", language, code, title });
const N = (variant, markdown) => ({ id: id(), type: "callout", variant, markdown });
const Q = (question, options, correctIndex, explanation) => ({ question, options, correctIndex, explanation });

const levels = [
  // ───────────────────────────── Level 1
  {
    title: "أساسيات البرمجة",
    subtitle: "كيف يفكّر الحاسوب… وكيف تفكّر أنت كمبرمج",
    description: "نبدأ من الصفر: ما هي البرمجة، كيف يعمل الحاسوب، التفكير المنطقي والخوارزميات، ومقدمة في علوم الحاسوب.",
    color: "#FFB547",
    icon: "Lightbulb",
    courses: [
      {
        title: "عالم البرمجة",
        description: "رحلتك الأولى: ما هي البرمجة، كيف يعمل الحاسوب، والتفكير المنطقي والخوارزميات.",
        icon: "Sparkles",
        color: "#FFB547",
        difficulty: "BEGINNER",
        modules: [
          {
            title: "البداية",
            lessons: [
              {
                title: "ما هي البرمجة؟",
                summary: "البرمجة هي فن إعطاء الأوامر للحاسوب بلغة يفهمها.",
                durationMin: 8,
                blocks: [
                  T(`## تخيّل روبوتًا ذكيًا… لكنه حرفيّ جدًا 🤖

الحاسوب سريع جدًا وقوي جدًا، لكنه **لا يفكّر وحده**. إنه ينفّذ الأوامر حرفيًا، بالترتيب، دون أن يخمّن ما تقصده.

**البرمجة** هي كتابة هذه الأوامر بطريقة واضحة ودقيقة، باستخدام **لغة برمجة** مثل Python أو JavaScript.

### أين تجد البرمجة حولك؟
- الألعاب التي تلعبها 🎮
- تطبيقات الهاتف والرسائل 📱
- إشارات المرور والمصاعد 🚦
- حتى الغسالة والميكروويف!`),
                  N("tip", "**البرنامج** = مجموعة أوامر مرتّبة تحل مشكلة أو تنجز مهمة."),
                  T("### أول برنامج في التاريخ لكل مبرمج\nجرت العادة أن يكون أول برنامج يكتبه أي مبرمج هو طباعة عبارة **Hello, World!** على الشاشة:"),
                  C("python", 'print("Hello, World!")\nprint("مرحبًا، أنا مبرمج جديد في وَمِيض ✨")', "hello.py"),
                  T("عندما يشغّل الحاسوب هذا البرنامج، سيطبع السطرين على الشاشة **بالترتيب**. سطر بعد سطر — هكذا يفكّر الحاسوب."),
                ],
                quiz: [
                  Q("ما هي البرمجة؟", ["إصلاح أجهزة الحاسوب", "كتابة أوامر واضحة ينفّذها الحاسوب", "استخدام الإنترنت", "تصميم الصور"], 1, "البرمجة هي كتابة تعليمات دقيقة بلغة يفهمها الحاسوب."),
                  Q("كيف ينفّذ الحاسوب الأوامر؟", ["بشكل عشوائي", "حسب مزاجه", "بالترتيب، أمرًا بعد أمر", "من الأسفل للأعلى دائمًا"], 2, "الحاسوب ينفّذ الأوامر بالترتيب الذي كتبناه."),
                  Q("ماذا يفعل الأمر print في Python؟", ["يطبع على الورق", "يعرض نصًا على الشاشة", "يحذف ملفًا", "يغلق البرنامج"], 1, "print تعرض النص على الشاشة."),
                ],
              },
              {
                title: "كيف يعمل الحاسوب؟",
                summary: "المدخلات، المعالجة، المخرجات… والذاكرة.",
                durationMin: 10,
                blocks: [
                  T(`## الحاسوب في ثلاث كلمات: مدخلات ← معالجة ← مخرجات

| المرحلة | ماذا يحدث | أمثلة |
|---|---|---|
| **المدخلات** Input | البيانات التي ندخلها | لوحة المفاتيح، الفأرة، الكاميرا |
| **المعالجة** Processing | الحاسوب "يفكّر" ويحسب | المعالج CPU |
| **المخرجات** Output | النتيجة التي نراها | الشاشة، السماعات، الطابعة |

### أهم أجزاء الحاسوب
- **المعالج (CPU):** عقل الحاسوب، ينفّذ مليارات العمليات في الثانية.
- **الذاكرة العشوائية (RAM):** طاولة عمل سريعة، تُمسح عند إطفاء الجهاز.
- **التخزين (SSD/HDD):** خزانة دائمة لملفاتك وبرامجك.`),
                  N("info", "عندما تفتح لعبة، تُنقل من **التخزين** إلى **الذاكرة** ثم يبدأ **المعالج** بتنفيذ أوامرها."),
                  T("### مثال: آلة حاسبة\nتكتب `5 + 3` (مدخلات) ← المعالج يجمع (معالجة) ← تظهر `8` (مخرجات)."),
                  C("python", "a = 5          # مدخلات\nb = 3\nresult = a + b # معالجة\nprint(result)  # مخرجات → 8", "calculator.py"),
                ],
                quiz: [
                  Q("أي جزء يُعتبر عقل الحاسوب؟", ["الشاشة", "المعالج CPU", "لوحة المفاتيح", "السماعات"], 1, "المعالج ينفّذ التعليمات ويجري الحسابات."),
                  Q("ماذا يحدث لمحتوى الذاكرة RAM عند إطفاء الجهاز؟", ["يبقى للأبد", "يُمسح", "ينتقل للشاشة", "يتضاعف"], 1, "الـ RAM ذاكرة مؤقتة تُمسح عند انقطاع الكهرباء."),
                  Q("الطابعة مثال على:", ["المدخلات", "المعالجة", "المخرجات", "التخزين"], 2, "الطابعة تُخرج النتائج على الورق."),
                ],
              },
            ],
          },
          {
            title: "التفكير المنطقي",
            lessons: [
              {
                title: "التفكير المنطقي: صح أم خطأ؟",
                summary: "القيم المنطقية والعمليات and و or و not.",
                durationMin: 10,
                blocks: [
                  T(`## كل قرار يبدأ بسؤال: صح أم خطأ؟

الحواسيب تتخذ القرارات بناءً على **شروط** نتيجتها إما **صح (True)** أو **خطأ (False)**.

- "هل عمري أكبر من 12؟" ← صح أو خطأ
- "هل كلمة المرور صحيحة؟" ← صح أو خطأ

### نربط الشروط بثلاث أدوات
- **and (و):** صح فقط إذا كان الشرطان صحيحين.
- **or (أو):** صح إذا كان واحد على الأقل صحيحًا.
- **not (ليس):** تقلب القيمة.`),
                  C("python", 'age = 13\nhas_ticket = True\n\nprint(age > 12 and has_ticket)   # True\nprint(age > 18 or has_ticket)    # True\nprint(not has_ticket)            # False', "logic.py"),
                  N("tip", "فكّر في **and** كبوابة تحتاج مفتاحين، وفي **or** كبوابة يكفيها مفتاح واحد."),
                ],
                quiz: [
                  Q("ما نتيجة True and False؟", ["True", "False"], 1, "and تحتاج أن يكون الطرفان صحيحين."),
                  Q("ما نتيجة True or False؟", ["True", "False"], 0, "or يكفيها طرف واحد صحيح."),
                  Q("ما نتيجة not False؟", ["True", "False"], 0, "not تقلب القيمة."),
                ],
              },
              {
                title: "الخوارزميات: وصفة لحل أي مشكلة",
                summary: "الخوارزمية خطوات مرتبة وواضحة تصل بنا للحل.",
                durationMin: 12,
                blocks: [
                  T(`## ما هي الخوارزمية؟

**الخوارزمية** هي مجموعة خطوات **مرتّبة** و**واضحة** و**محدودة** تحل مشكلة ما.
وصفة الكعكة خوارزمية! وطريقك إلى المدرسة خوارزمية أيضًا.

### خوارزمية: هل الرقم زوجي؟
1. خذ الرقم.
2. اقسمه على 2.
3. إذا كان الباقي 0 ← الرقم **زوجي**.
4. وإلا ← الرقم **فردي**.

### صفات الخوارزمية الجيدة
- **واضحة:** لا تحتمل أكثر من معنى.
- **مرتّبة:** ترتيب الخطوات مهم.
- **تنتهي:** لا تدور للأبد.`),
                  C("python", 'number = 7\nif number % 2 == 0:\n    print("زوجي")\nelse:\n    print("فردي")', "even_odd.py"),
                  N("warning", "خطوة غامضة مثل «أضف قليلًا من السكر» قد تُفهم عند البشر، لكن الحاسوب يحتاج **رقمًا محددًا**!"),
                ],
                quiz: [
                  Q("أي مما يلي ليس من صفات الخوارزمية الجيدة؟", ["واضحة", "مرتّبة", "لا تنتهي أبدًا", "محددة الخطوات"], 2, "الخوارزمية يجب أن تنتهي."),
                  Q("الرمز % في Python يعطينا:", ["ناتج القسمة", "باقي القسمة", "النسبة المئوية", "الضرب"], 1, "% يعطي باقي القسمة (modulo)."),
                ],
              },
            ],
          },
        ],
      },
      {
        title: "حل المشكلات",
        description: "مهارات المبرمج الحقيقية: التقسيم، اكتشاف الأنماط، والتجريد.",
        icon: "Puzzle",
        color: "#FF6B81",
        difficulty: "BEGINNER",
        modules: [
          {
            title: "مهارات الحل",
            lessons: [
              {
                title: "قسّم تسُد: تقسيم المشكلة",
                summary: "المشكلة الكبيرة = مجموعة مشكلات صغيرة.",
                durationMin: 10,
                blocks: [
                  T(`## لا تأكل الفيل دفعة واحدة 🐘

المبرمجون المحترفون لا يحلّون المشكلات الكبيرة مرة واحدة، بل **يقسّمونها** إلى أجزاء صغيرة يسهل حلها. هذه المهارة اسمها **Decomposition**.

### مثال: صنع لعبة سباق
- رسم السيارة 🚗
- تحريك السيارة بالأسهم ⬅️➡️
- رسم الطريق والعوائق 🚧
- حساب النقاط والوقت ⏱️
- شاشة الفوز والخسارة 🏁

كل جزء صغير يمكنك برمجته واختباره وحده!`),
                  N("tip", "قبل أن تكتب سطر كود واحد، اكتب قائمة بالأجزاء الصغيرة للمشكلة."),
                ],
                quiz: [Q("ما الفائدة الأساسية من تقسيم المشكلة؟", ["تصبح أطول", "يسهل حل واختبار كل جزء", "لا فائدة", "تحتاج حاسوبًا أسرع"], 1, "الأجزاء الصغيرة أسهل في الحل والاختبار.")],
              },
              {
                title: "الأنماط والتجريد",
                summary: "اكتشف ما يتكرر، وتجاهل التفاصيل غير المهمة.",
                durationMin: 10,
                blocks: [
                  T(`## الأنماط Patterns
عندما ترى شيئًا **يتكرر**، فهذه فرصة لتكتبه مرة واحدة وتعيد استخدامه.
مثال: 2، 4، 6، 8… ما التالي؟ النمط: **أضف 2 في كل مرة**.

## التجريد Abstraction
هو التركيز على **المهم** وتجاهل التفاصيل. خريطة المترو لا تُظهر كل شارع — فقط المحطات والخطوط، وهذا يكفي للوصول.`),
                  C("python", "for i in range(1, 6):\n    print(i * 2)   # 2 4 6 8 10", "pattern.py"),
                ],
                quiz: [Q("ما الرقم التالي: 3، 6، 9، 12، …؟", ["13", "14", "15", "18"], 2, "النمط: أضف 3.")],
              },
            ],
          },
        ],
      },
      {
        title: "مقدمة في علوم الحاسوب",
        description: "على طريقة CS50: كيف تُمثَّل البيانات، وكيف تعمل خوارزميات البحث والترتيب.",
        icon: "Cpu",
        color: "#A78BFA",
        difficulty: "INTERMEDIATE",
        modules: [
          {
            title: "تمثيل البيانات",
            lessons: [
              {
                title: "النظام الثنائي: لغة الأصفار والآحاد",
                summary: "لماذا يفهم الحاسوب 0 و 1 فقط؟",
                durationMin: 14,
                blocks: [
                  T(`## الحاسوب مليارات من المفاتيح الصغيرة 💡
كل مفتاح (ترانزستور) إما **مطفأ = 0** أو **مضاء = 1**. كل رقم منها يسمى **bit**، وكل 8 bits تسمى **byte**.

### كيف نكتب الأرقام بالثنائي؟
كل خانة قيمتها ضعف التي على يمينها: 8 ، 4 ، 2 ، 1

| الثنائي | الحساب | العشري |
|---|---|---|
| 0101 | 4 + 1 | **5** |
| 1010 | 8 + 2 | **10** |
| 1111 | 8+4+2+1 | **15** |`),
                  C("python", 'print(bin(10))      # 0b1010\nprint(int("1111", 2))  # 15', "binary.py"),
                  N("info", "بـ 8 bits يمكنك تمثيل 256 قيمة مختلفة (من 0 إلى 255)."),
                ],
                quiz: [
                  Q("كم يساوي الرقم الثنائي 0110؟", ["5", "6", "7", "12"], 1, "4 + 2 = 6"),
                  Q("كم bit في الـ byte الواحد؟", ["2", "4", "8", "16"], 2, "البايت = 8 بت."),
                ],
              },
              {
                title: "كيف تُخزَّن النصوص والصور؟",
                summary: "ASCII وUnicode والبكسلات وألوان RGB.",
                durationMin: 12,
                blocks: [
                  T(`## الحروف أرقام في الحقيقة!
كل حرف له رقم. في نظام **ASCII** الحرف \`A\` = 65. ونظام **Unicode** يغطي كل لغات العالم — بما فيها العربية والإيموجي 😄.

## الصور = شبكة من البكسلات
كل بكسل لونه مكوّن من ثلاثة أرقام **RGB**: أحمر، أخضر، أزرق (كل منها من 0 إلى 255).
- (255, 0, 0) ← أحمر
- (255, 181, 71) ← كهرماني وَمِيض ✨`),
                  C("python", 'print(ord("A"))   # 65\nprint(chr(1605))  # م', "chars.py"),
                ],
                quiz: [Q("اللون (0, 0, 255) هو:", ["أحمر", "أخضر", "أزرق", "أسود"], 2, "القيمة الثالثة هي الأزرق.")],
              },
            ],
          },
          {
            title: "البحث والترتيب",
            lessons: [
              {
                title: "البحث الخطي والبحث الثنائي",
                summary: "كيف تجد اسمًا في دفتر هاتف من 1000 صفحة؟",
                durationMin: 15,
                blocks: [
                  T(`## البحث الخطي Linear Search
تبدأ من الأول وتفحص عنصرًا عنصرًا. بسيط، لكنه بطيء مع البيانات الكبيرة.

## البحث الثنائي Binary Search
إذا كانت البيانات **مرتّبة**: افتح المنتصف، ثم تخلّص من النصف الذي لا يحتوي الهدف، وكرر.
مع مليون عنصر تحتاج **20 خطوة فقط** تقريبًا! 🚀`),
                  C("python", "def binary_search(items, target):\n    low, high = 0, len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return mid\n        if items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\nprint(binary_search([1, 3, 5, 7, 9, 11], 7))  # 3", "search.py"),
                  N("warning", "البحث الثنائي يعمل فقط على بيانات **مرتّبة**."),
                ],
                quiz: [Q("ما شرط استخدام البحث الثنائي؟", ["أن تكون البيانات قليلة", "أن تكون البيانات مرتّبة", "أن تكون نصوصًا", "لا شروط"], 1, "يعتمد على الترتيب ليتخلص من نصف البيانات كل مرة.")],
              },
              {
                title: "خوارزميات الترتيب",
                summary: "Bubble Sort وSelection Sort — كيف نرتّب البيانات؟",
                durationMin: 15,
                blocks: [
                  T(`## الترتيب بالفقاعات Bubble Sort
قارن كل عنصرين متجاورين، وبدّلهما إذا كانا بالترتيب الخطأ. كرّر حتى لا يحدث أي تبديل. العناصر الكبيرة "تطفو" للنهاية مثل الفقاعات 🫧.`),
                  C("python", "def bubble_sort(items):\n    n = len(items)\n    for i in range(n):\n        for j in range(n - i - 1):\n            if items[j] > items[j + 1]:\n                items[j], items[j + 1] = items[j + 1], items[j]\n    return items\n\nprint(bubble_sort([5, 2, 9, 1, 7]))  # [1, 2, 5, 7, 9]", "sort.py"),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────── Level 2
  {
    title: "لغات البرمجة",
    subtitle: "Python وJavaScript و++C وهياكل البيانات",
    description: "تتعلّم أول لغة برمجة بعمق، ثم تتعرف على لغات أخرى وتفهم هياكل البيانات.",
    color: "#7C5CFF",
    icon: "CodeXml",
    courses: [
      {
        title: "Python من الصفر",
        description: "أسهل لغة للبداية وأقواها في الذكاء الاصطناعي وتحليل البيانات.",
        icon: "Terminal",
        color: "#7C5CFF",
        difficulty: "BEGINNER",
        modules: [
          {
            title: "البدايات",
            lessons: [
              {
                title: "المتغيرات وأنواع البيانات",
                summary: "صناديق نخزّن فيها المعلومات.",
                durationMin: 12,
                blocks: [
                  T(`## المتغير = صندوق له اسم 📦
نضع فيه قيمة، ونستخدمها لاحقًا باسمها.

### أنواع البيانات الأساسية
| النوع | مثال | الوصف |
|---|---|---|
| \`int\` | \`15\` | عدد صحيح |
| \`float\` | \`3.14\` | عدد عشري |
| \`str\` | \`"سارة"\` | نص |
| \`bool\` | \`True\` | صح / خطأ |`),
                  C("python", 'name = "سارة"\nage = 13\nheight = 1.52\nloves_code = True\n\nprint(name, "عمرها", age)\nprint(type(height))  # <class \'float\'>', "variables.py"),
                  N("tip", "اختر أسماء واضحة: `student_age` أفضل بكثير من `x`."),
                ],
                quiz: [
                  Q('ما نوع القيمة "123"؟', ["int", "str", "float", "bool"], 1, "أي شيء بين علامتي تنصيص هو نص str."),
                  Q("أي اسم متغير أوضح؟", ["a", "x1", "total_score", "t"], 2, "الاسم الواضح يشرح محتوى المتغير."),
                ],
              },
              {
                title: "الإدخال والعمليات الحسابية",
                summary: "نجعل البرنامج يتحدث مع المستخدم.",
                durationMin: 12,
                blocks: [
                  T("## input: اسأل المستخدم\nالدالة `input` تنتظر المستخدم ليكتب شيئًا وتعيده **نصًا** دائمًا. لتحويله لرقم نستخدم `int()`."),
                  C("python", 'name = input("ما اسمك؟ ")\nage = int(input("كم عمرك؟ "))\nprint("أهلًا", name)\nprint("بعد 10 سنوات سيكون عمرك", age + 10)', "input.py"),
                  T("### العمليات الحسابية\n`+` جمع، `-` طرح، `*` ضرب، `/` قسمة، `//` قسمة صحيحة، `%` باقي القسمة، `**` أُس."),
                ],
                quiz: [Q("ما ناتج 7 // 2 ؟", ["3.5", "3", "4", "1"], 1, "// تعطي القسمة الصحيحة بدون الكسر.")],
              },
            ],
          },
          {
            title: "التحكم في مسار البرنامج",
            lessons: [
              {
                title: "الشروط: if و elif و else",
                summary: "اجعل برنامجك يتخذ القرارات.",
                durationMin: 12,
                blocks: [
                  T("## البرنامج يقرّر 🤔\nبالشرط `if` ينفّذ البرنامج كودًا **فقط** إذا كان الشرط صحيحًا."),
                  C("python", 'score = 85\n\nif score >= 90:\n    print("ممتاز 🌟")\nelif score >= 75:\n    print("جيد جدًا 👏")\nelse:\n    print("استمر في التدريب 💪")', "grades.py"),
                  N("warning", "المسافات البادئة (Indentation) في Python **إلزامية**؛ هي التي تحدد أي كود داخل الشرط."),
                ],
                quiz: [Q("ماذا يطبع الكود السابق إذا كانت score = 60؟", ["ممتاز", "جيد جدًا", "استمر في التدريب", "لا شيء"], 2, "لا يتحقق أي من الشرطين فينفّذ else.")],
              },
              {
                title: "الحلقات: for و while",
                summary: "كرّر الأوامر دون أن تكتبها مئة مرة.",
                durationMin: 14,
                blocks: [
                  T("## الحلقة = تكرار ذكي 🔁\n`for` تكرر عددًا معروفًا من المرات، و`while` تكرر **ما دام** الشرط صحيحًا."),
                  C("python", 'for i in range(1, 6):\n    print("المحاولة رقم", i)\n\ncount = 3\nwhile count > 0:\n    print(count)\n    count -= 1\nprint("انطلق! 🚀")', "loops.py"),
                  N("warning", "احذر الحلقة اللانهائية: إذا لم يصبح شرط while خطأً أبدًا، سيعمل البرنامج للأبد!"),
                ],
                quiz: [
                  Q("كم مرة تتكرر range(5)؟", ["4", "5", "6", "لا نهائي"], 1, "range(5) تعطي 0,1,2,3,4 أي 5 مرات."),
                  Q("متى تتوقف حلقة while؟", ["بعد 10 مرات", "عندما يصبح الشرط خطأ", "لا تتوقف أبدًا", "عند الطباعة"], 1, "while تستمر ما دام الشرط صحيحًا."),
                ],
              },
              {
                title: "الدوال: ابنِ أدواتك الخاصة",
                summary: "اكتب الكود مرة واحدة واستخدمه في كل مكان.",
                durationMin: 14,
                blocks: [
                  T("## الدالة Function\nكتلة كود لها اسم، تستقبل **مدخلات (parameters)** وقد تُرجع **نتيجة (return)**."),
                  C("python", 'def greet(name):\n    return f"أهلًا يا {name}! 👋"\n\ndef area(width, height):\n    return width * height\n\nprint(greet("عمر"))\nprint(area(4, 5))  # 20', "functions.py"),
                  N("tip", "إذا وجدت نفسك تنسخ نفس الكود أكثر من مرتين — حان وقت كتابة دالة!"),
                ],
                quiz: [Q("ما وظيفة return؟", ["طباعة القيمة", "إرجاع نتيجة من الدالة", "إنهاء البرنامج كله", "تكرار الدالة"], 1, "return تعيد قيمة لمن استدعى الدالة.")],
              },
            ],
          },
        ],
      },
      {
        title: "أساسيات JavaScript",
        description: "لغة الويب: كل موقع تزوره يستخدمها.",
        icon: "Braces",
        color: "#FFB547",
        difficulty: "BEGINNER",
        modules: [
          {
            title: "مرحبًا JavaScript",
            lessons: [
              {
                title: "المتغيرات والدوال في JavaScript",
                summary: "let و const والدوال السهمية.",
                durationMin: 12,
                blocks: [
                  T("## نفس الأفكار… بقواعد كتابة مختلفة\nما تعلمته في Python ينتقل معك! الفرق في **الصياغة** فقط."),
                  C("javascript", 'const name = "لينا";\nlet score = 0;\nscore += 10;\n\nconst greet = (who) => `أهلًا ${who}!`;\n\nconsole.log(greet(name), score);', "hello.js"),
                  N("info", "`const` لقيمة لا تتغير، و`let` لقيمة ستتغير."),
                ],
                quiz: [Q("أي كلمة نستخدم لمتغير ستتغير قيمته؟", ["const", "let", "print", "def"], 1, "let للقيم المتغيرة.")],
              },
              {
                title: "المصفوفات والكائنات",
                summary: "Arrays و Objects لتنظيم البيانات.",
                durationMin: 12,
                blocks: [
                  C("javascript", 'const fruits = ["تفاح", "موز", "برتقال"];\nfruits.push("مانجو");\n\nconst student = { name: "عمر", age: 16, skills: ["Python", "JS"] };\nconsole.log(student.name, fruits.length);', "data.js"),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
      {
        title: "++C للمبتدئين",
        description: "لغة الأداء العالي: الألعاب، الأنظمة، والمسابقات البرمجية.",
        icon: "Cpu",
        color: "#38BDF8",
        difficulty: "INTERMEDIATE",
        modules: [
          {
            title: "أول برنامج",
            lessons: [
              {
                title: "مرحبًا ++C",
                summary: "البنية الأساسية لبرنامج ++C.",
                durationMin: 12,
                blocks: [
                  T("## ++C لغة \"مُترجَمة\"\nقبل التشغيل يحوّل **المترجم (compiler)** الكود كله إلى لغة الآلة، لذلك برامجها سريعة جدًا ⚡."),
                  C("cpp", '#include <iostream>\nusing namespace std;\n\nint main() {\n    int age = 15;\n    cout << "Hello from C++! Age: " << age << endl;\n    return 0;\n}', "main.cpp"),
                  N("tip", "في ++C يجب أن تحدد نوع كل متغير: `int` و`double` و`string`…"),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
      {
        title: "هياكل البيانات",
        description: "القوائم والقواميس والمكدّس والطابور — كيف ننظّم البيانات بذكاء.",
        icon: "Layers",
        color: "#22C5A0",
        difficulty: "INTERMEDIATE",
        modules: [
          {
            title: "الهياكل الأساسية",
            lessons: [
              {
                title: "القوائم والقواميس",
                summary: "list و dict في Python.",
                durationMin: 14,
                blocks: [
                  C("python", 'scores = [90, 75, 88]\nscores.append(95)\nprint(max(scores))\n\nphone_book = {"سارة": "0501", "عمر": "0502"}\nprint(phone_book["عمر"])', "structures.py"),
                  T("**القائمة** مرتّبة ونصل لعناصرها بالرقم (index). **القاموس** يربط **مفتاحًا** بـ**قيمة** — بحث فوري بالاسم."),
                ],
                quiz: [Q("ما أفضل هيكل لتخزين أرقام هواتف حسب الاسم؟", ["list", "dict", "int", "str"], 1, "القاموس يربط الاسم (مفتاح) بالرقم (قيمة).")],
              },
              {
                title: "المكدّس والطابور",
                summary: "Stack (آخر من يدخل أول من يخرج) و Queue (أول من يدخل أول من يخرج).",
                durationMin: 12,
                blocks: [
                  T("- **Stack:** مثل كومة الصحون 🍽️ — تأخذ من الأعلى. زر **تراجع (Undo)** يعمل هكذا!\n- **Queue:** مثل طابور المقصف 🧃 — من يأتي أولًا يُخدم أولًا."),
                  C("python", "from collections import deque\n\nstack = []\nstack.append(1); stack.append(2)\nprint(stack.pop())      # 2\n\nqueue = deque([1, 2])\nqueue.append(3)\nprint(queue.popleft())  # 1", "stack_queue.py"),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────── Level 3
  {
    title: "تطوير الويب",
    subtitle: "الواجهات، الخوادم، وقواعد البيانات",
    description: "ابنِ مواقع وتطبيقات ويب كاملة: HTML وCSS وJavaScript وReact وNext.js ثم Node.js وقواعد البيانات والـ APIs.",
    color: "#38BDF8",
    icon: "Globe",
    courses: [
      {
        title: "HTML و CSS",
        description: "هيكل الصفحة وتصميمها.",
        icon: "Palette",
        color: "#FF6B81",
        difficulty: "BEGINNER",
        modules: [
          {
            title: "بناء الصفحات",
            lessons: [
              {
                title: "HTML: هيكل الصفحة",
                summary: "الوسوم (tags) التي تُبنى منها كل صفحات الويب.",
                durationMin: 12,
                blocks: [
                  T("## HTML = الهيكل العظمي للصفحة 🦴\nنكتب المحتوى داخل **وسوم** مثل `<h1>` للعنوان و`<p>` للفقرة."),
                  C("html", '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n  <head>\n    <title>صفحتي</title>\n  </head>\n  <body>\n    <h1>أهلًا بكم!</h1>\n    <p>أنا أتعلم البرمجة في وَمِيض.</p>\n    <a href="https://example.com">رابط</a>\n  </body>\n</html>', "index.html"),
                ],
                quiz: [Q("أي وسم نستخدمه لأكبر عنوان؟", ["<p>", "<h1>", "<a>", "<title>"], 1, "h1 هو العنوان الرئيسي.")],
              },
              {
                title: "CSS: الألوان والتخطيط",
                summary: "اجعل صفحتك جميلة ومتجاوبة.",
                durationMin: 14,
                blocks: [
                  C("css", "body {\n  font-family: sans-serif;\n  background: #f6f5fb;\n}\n\n.card {\n  display: flex;\n  gap: 16px;\n  padding: 24px;\n  border-radius: 16px;\n  background: white;\n}", "style.css"),
                  N("tip", "استخدم **Flexbox** و**Grid** للتخطيط بدل الحيل القديمة."),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
      {
        title: "React: واجهات تفاعلية",
        description: "ابنِ الواجهات من مكوّنات صغيرة قابلة لإعادة الاستخدام.",
        icon: "Atom",
        color: "#38BDF8",
        difficulty: "INTERMEDIATE",
        modules: [
          {
            title: "المكوّنات والحالة",
            lessons: [
              {
                title: "المكوّنات Components",
                summary: "قطع ليغو لبناء الواجهات.",
                durationMin: 14,
                blocks: [
                  C("javascript", 'function Badge({ title }) {\n  return <span className="badge">🏅 {title}</span>;\n}\n\nexport default function Profile() {\n  return (\n    <div>\n      <h2>سارة</h2>\n      <Badge title="أول شرارة" />\n    </div>\n  );\n}', "Profile.jsx"),
                ],
                quiz: [],
              },
              {
                title: "الحالة useState",
                summary: "بيانات تتغير فتتحدث الواجهة تلقائيًا.",
                durationMin: 14,
                blocks: [
                  C("javascript", 'import { useState } from "react";\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>نقرت {count} مرة</button>;\n}', "Counter.jsx"),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
      {
        title: "Next.js",
        description: "إطار React الاحترافي لبناء مواقع كاملة — مثل وَمِيض نفسه!",
        icon: "Rocket",
        color: "#6A48F5",
        difficulty: "ADVANCED",
        modules: [
          {
            title: "مقدمة",
            lessons: [
              {
                title: "الصفحات والتوجيه",
                summary: "كل مجلد داخل app يصبح رابطًا.",
                durationMin: 12,
                blocks: [
                  T("## التوجيه بالملفات\n`app/page.js` ← الصفحة الرئيسية `/`\n`app/about/page.js` ← `/about`"),
                  C("javascript", "export default function AboutPage() {\n  return <h1>عن أكاديمية وَمِيض</h1>;\n}", "app/about/page.js"),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
      {
        title: "الخوادم وقواعد البيانات",
        description: "Node.js وقواعد البيانات SQL وبناء الـ APIs.",
        icon: "Server",
        color: "#22C5A0",
        difficulty: "ADVANCED",
        modules: [
          {
            title: "الخلفية Backend",
            lessons: [
              {
                title: "ما هو الخادم و Node.js؟",
                summary: "الكود الذي يعمل خلف الكواليس.",
                durationMin: 12,
                blocks: [
                  T("## العميل والخادم\nالمتصفح (**العميل**) يطلب، والخادم (**Server**) يجيب. **Node.js** يسمح لنا بكتابة الخادم بـ JavaScript."),
                  C("javascript", 'import http from "node:http";\n\nhttp\n  .createServer((req, res) => res.end("مرحبًا من الخادم 👋"))\n  .listen(3000);', "server.js"),
                ],
                quiz: [],
              },
              {
                title: "قواعد البيانات و SQL",
                summary: "تخزين البيانات بشكل منظّم والاستعلام عنها.",
                durationMin: 14,
                blocks: [
                  C("sql", "CREATE TABLE students (\n  id INTEGER PRIMARY KEY,\n  name TEXT,\n  xp INTEGER\n);\n\nSELECT name, xp FROM students\nWHERE xp > 100\nORDER BY xp DESC;", "queries.sql"),
                ],
                quiz: [Q("أي أمر SQL يجلب البيانات؟", ["INSERT", "SELECT", "DELETE", "CREATE"], 1, "SELECT للاستعلام وقراءة البيانات.")],
              },
              {
                title: "بناء API",
                summary: "واجهة تتحدث بها التطبيقات مع بعضها بصيغة JSON.",
                durationMin: 14,
                blocks: [
                  C("javascript", 'export async function GET() {\n  const students = [{ name: "سارة", xp: 320 }];\n  return Response.json(students);\n}', "app/api/students/route.js"),
                  N("info", "أغلب التطبيقات الحديثة = واجهة (Frontend) + API + قاعدة بيانات."),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────── Level 4
  {
    title: "المطوّر المحترف",
    subtitle: "أدوات وعادات فرق البرمجة الحقيقية",
    description: "Git وGitHub، الكود النظيف، هندسة البرمجيات، ثم مشاريع حقيقية ضمن فريق ومعرض أعمال.",
    color: "#22C5A0",
    icon: "Rocket",
    courses: [
      {
        title: "Git و GitHub",
        description: "آلة الزمن لكودك، ومنصة التعاون مع الفرق.",
        icon: "GitBranch",
        color: "#FB923C",
        difficulty: "INTERMEDIATE",
        modules: [
          {
            title: "التحكم بالإصدارات",
            lessons: [
              {
                title: "أساسيات Git",
                summary: "commit و branch و merge.",
                durationMin: 14,
                blocks: [
                  C("bash", 'git init\ngit add .\ngit commit -m "أول نسخة من مشروعي"\ngit switch -c feature/login\ngit merge feature/login', "terminal"),
                  N("tip", "اكتب رسائل commit تشرح **لماذا** غيّرت الكود، لا فقط **ماذا** غيّرت."),
                ],
                quiz: [],
              },
              {
                title: "التعاون على GitHub",
                summary: "Pull Requests ومراجعة الكود.",
                durationMin: 12,
                blocks: [T("## سير العمل في الفريق\n1. أنشئ **branch** لميزتك.\n2. ارفعها `git push`.\n3. افتح **Pull Request**.\n4. زميلك يراجع الكود ويعلّق.\n5. بعد الموافقة ← **merge** ✅")],
                quiz: [],
              },
            ],
          },
        ],
      },
      {
        title: "الكود النظيف",
        description: "اكتب كودًا يفهمه البشر، لا الحاسوب فقط.",
        icon: "Wrench",
        color: "#A78BFA",
        difficulty: "INTERMEDIATE",
        modules: [
          {
            title: "مبادئ",
            lessons: [
              {
                title: "أسماء واضحة ودوال صغيرة",
                summary: "أهم عادتين لكود نظيف.",
                durationMin: 10,
                blocks: [
                  C("python", "# ❌ قبل\ndef f(a, b):\n    return a * b * 0.15\n\n# ✅ بعد\nTAX_RATE = 0.15\n\ndef calculate_tax(price, quantity):\n    return price * quantity * TAX_RATE", "clean.py"),
                  T("- دالة واحدة = مهمة واحدة.\n- الأسماء تشرح الهدف.\n- لا أرقام سحرية — استخدم ثوابت بأسماء."),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
      {
        title: "هندسة البرمجيات",
        description: "كيف تُصمَّم الأنظمة الكبيرة وتُقسَّم إلى طبقات.",
        icon: "Workflow",
        color: "#38BDF8",
        difficulty: "ADVANCED",
        modules: [
          {
            title: "التصميم",
            lessons: [
              {
                title: "طبقات التطبيق",
                summary: "الواجهة، منطق العمل، والبيانات.",
                durationMin: 12,
                blocks: [T("## فصل المسؤوليات\n- **طبقة العرض:** ما يراه المستخدم.\n- **طبقة المنطق:** القواعد والحسابات.\n- **طبقة البيانات:** التخزين والاسترجاع.\n\nعندما تتغير واجهتك، لا يجب أن تعيد كتابة قاعدة البيانات!")],
                quiz: [],
              },
            ],
          },
        ],
      },
      {
        title: "مشاريع حقيقية",
        description: "طبّق كل ما تعلمته في مشاريع تضيفها لمعرض أعمالك.",
        icon: "Trophy",
        color: "#FFB547",
        difficulty: "ADVANCED",
        modules: [
          {
            title: "من الفكرة للإطلاق",
            lessons: [
              {
                title: "كيف تبني مشروعًا من الصفر",
                summary: "الفكرة ← التخطيط ← البناء ← الاختبار ← الإطلاق.",
                durationMin: 12,
                blocks: [
                  T("## دورة حياة المشروع\n1. **الفكرة:** ما المشكلة التي تحلها؟ ولمن؟\n2. **التخطيط:** قسّم إلى مهام صغيرة.\n3. **البناء:** نسخة أولى بسيطة (MVP).\n4. **الاختبار:** اطلب من أصدقائك تجربته.\n5. **الإطلاق:** انشره وأضفه لمعرض أعمالك 🎉"),
                  N("tip", "المشروع البسيط المكتمل أفضل من المشروع العملاق الذي لم ينتهِ."),
                ],
                quiz: [],
              },
            ],
          },
        ],
      },
    ],
  },
];

const tasks = [
  {
    ref: { course: "عالم البرمجة", lesson: "الخوارزميات: وصفة لحل أي مشكلة" },
    title: "اكتب خوارزمية تحضير كوب شاي ☕",
    type: "HOMEWORK",
    difficulty: "EASY",
    points: 20,
    skills: ["الخوارزميات", "التفكير المنطقي"],
    description: "## المطلوب\nاكتب خطوات **مرقّمة وواضحة** لتحضير كوب شاي، وكأنك تشرحها لروبوت لا يعرف شيئًا.\n\n## معايير التقييم\n- الخطوات مرتّبة ومنطقية\n- لا توجد خطوة غامضة\n- الخوارزمية تنتهي",
  },
  {
    ref: { course: "Python من الصفر" },
    title: "آلة حاسبة بسيطة 🧮",
    type: "TASK",
    difficulty: "MEDIUM",
    points: 40,
    days: 10,
    skills: ["المتغيرات", "input", "الشروط"],
    description: "## المطلوب\nاكتب برنامج Python يطلب من المستخدم رقمين وعملية (+ - * /) ويطبع النتيجة.\n\n## إضافات للمتميزين ⭐\n- التعامل مع القسمة على صفر\n- تكرار العملية حتى يكتب المستخدم `q`",
  },
  {
    ref: { course: "Python من الصفر", lesson: "الحلقات: for و while" },
    title: "تحدي FizzBuzz 🔥",
    type: "CHALLENGE",
    difficulty: "MEDIUM",
    points: 50,
    days: 7,
    skills: ["الحلقات", "الشروط", "%"],
    description: "## التحدي الكلاسيكي\nاطبع الأرقام من 1 إلى 100، لكن:\n- مضاعفات 3 ← اطبع `Fizz`\n- مضاعفات 5 ← اطبع `Buzz`\n- مضاعفات 3 و 5 معًا ← اطبع `FizzBuzz`",
  },
  {
    ref: { course: "Python من الصفر" },
    title: "مشروع: لعبة تخمين الرقم 🎯",
    type: "PROJECT",
    difficulty: "HARD",
    points: 100,
    days: 14,
    skills: ["الحلقات", "الدوال", "random"],
    description: "## الفكرة\nالحاسوب يختار رقمًا عشوائيًا من 1 إلى 100، والمستخدم يخمّن. بعد كل محاولة يقول البرنامج: أكبر ⬆️ أو أصغر ⬇️.\n\n## المتطلبات\n- عدّاد للمحاولات\n- رسالة فوز مع عدد المحاولات\n- سؤال: هل تريد اللعب مرة أخرى؟\n\nسلّم الكود مع شرح قصير لطريقة تفكيرك.",
  },
  {
    ref: { course: "HTML و CSS" },
    title: "مشروع: صفحتك الشخصية الأولى 🌐",
    type: "PROJECT",
    difficulty: "MEDIUM",
    points: 80,
    days: 21,
    skills: ["HTML", "CSS", "Flexbox"],
    description: "## المطلوب\nصمّم صفحة تعريفية عنك: اسمك، هواياتك، مهاراتك البرمجية، ومشاريعك القادمة.\n\nارفع ملفات المشروع أو ضع رابط Replit / GitHub Pages.",
  },
  {
    ref: null,
    title: "تحدي الأسبوع: اكتشف النمط 🧩",
    type: "CHALLENGE",
    difficulty: "EASY",
    points: 30,
    days: 5,
    skills: ["الأنماط", "حل المشكلات"],
    description: "ما الرقم التالي في كل سلسلة؟ واشرح النمط:\n1. 1، 4، 9، 16، …\n2. 1، 1، 2، 3، 5، 8، …\n3. 2، 6، 12، 20، …",
  },
];

const achievements = [
  { key: "first_lesson", title: "أول شرارة", description: "أكملت أول درس في رحلتك", icon: "Sparkles", color: "#FFB547", criteria: "LESSONS_COMPLETED", threshold: 1, xpBonus: 10 },
  { key: "lessons_10", title: "متعلّم نشيط", description: "أكملت 10 دروس", icon: "BookOpen", color: "#7C5CFF", criteria: "LESSONS_COMPLETED", threshold: 10, xpBonus: 30 },
  { key: "lessons_30", title: "عقل لا يتوقف", description: "أكملت 30 درسًا", icon: "Brain", color: "#A78BFA", criteria: "LESSONS_COMPLETED", threshold: 30, xpBonus: 80 },
  { key: "first_task", title: "أول إنجاز", description: "قُبل أول حل لك", icon: "Target", color: "#22C5A0", criteria: "TASKS_APPROVED", threshold: 1, xpBonus: 20 },
  { key: "tasks_5", title: "منجز محترف", description: "قُبلت 5 من حلولك", icon: "Medal", color: "#38BDF8", criteria: "TASKS_APPROVED", threshold: 5, xpBonus: 60 },
  { key: "streak_3", title: "شعلة متّقدة", description: "تعلّمت 3 أيام متتالية", icon: "Flame", color: "#FF6B81", criteria: "STREAK_DAYS", threshold: 3, xpBonus: 15 },
  { key: "streak_7", title: "أسبوع ناري", description: "تعلّمت 7 أيام متتالية", icon: "Zap", color: "#FB923C", criteria: "STREAK_DAYS", threshold: 7, xpBonus: 50 },
  { key: "quiz_perfect", title: "عين الصقر", description: "علامة كاملة في اختبار", icon: "Gem", color: "#F472B6", criteria: "QUIZ_PERFECT", threshold: 1, xpBonus: 10 },
  { key: "quiz_perfect_10", title: "عبقري الاختبارات", description: "علامة كاملة في 10 اختبارات", icon: "Crown", color: "#FFB547", criteria: "QUIZ_PERFECT", threshold: 10, xpBonus: 60 },
  { key: "course_1", title: "خاتم الدورة", description: "أنهيت دورة كاملة", icon: "GraduationCap", color: "#22C5A0", criteria: "COURSES_COMPLETED", threshold: 1, xpBonus: 50 },
  { key: "xp_500", title: "نجم صاعد", description: "جمعت 500 نقطة خبرة", icon: "Star", color: "#7C5CFF", criteria: "XP_EARNED", threshold: 500, xpBonus: 0 },
  { key: "team_spirit", title: "روح الفريق", description: "ساعدت زملاءك — يمنحه المعلّم", icon: "Heart", color: "#FF6B81", criteria: "MANUAL", threshold: 1, xpBonus: 25 },
  { key: "creative", title: "المبدع", description: "فكرة مشروع مميزة — يمنحه المعلّم", icon: "Palette", color: "#F472B6", criteria: "MANUAL", threshold: 1, xpBonus: 25 },
];

module.exports = { levels, tasks, achievements };
