import type { Severity, RuleCategory } from "../types.js";
import type { Rule, RuleCheckParams, RuleFinding } from "./types.js";
import { matchPatterns } from "./match-patterns.js";

// ---------------------------------------------------------------------------
// multilingual.ignore-previous
//
// Detects "ignore previous instructions" in multiple languages.
// ---------------------------------------------------------------------------

const ignorePreviousMultilingualPatterns: Array<{
  regex: RegExp;
  confidence: number;
  detail?: string;
}> = [
  // Japanese
  {
    regex: /(前の|以前の|これまでの|全ての)(指示|命令|ルール|ガイドライン)を(無視|忘れ|破棄|取り消)/gi,
    confidence: 0.9,
    detail: "Japanese: ignore previous instructions pattern",
  },
  {
    regex: /(指示|命令)に(従わないで|従うな)/gi,
    confidence: 0.85,
    detail: "Japanese: do not follow instructions pattern",
  },
  // Chinese (Simplified + Traditional)
  {
    regex: /忽略(之前|以前|所有)(的)?(指令|指示|规则)/gi,
    confidence: 0.9,
    detail: "Chinese: ignore previous instructions (忽略...指令)",
  },
  {
    regex: /无视(之前|所有)(的)?(指令|指示)/gi,
    confidence: 0.9,
    detail: "Chinese: disregard previous instructions (无视...指令)",
  },
  // Korean
  {
    regex: /(이전|모든|위의)\s*(지시|명령|규칙)(을|를)?\s*(무시|잊어|취소)/gi,
    confidence: 0.9,
    detail: "Korean: ignore previous instructions pattern",
  },
  // Spanish
  {
    regex: /ignora\s+(todas?\s+)?(las?\s+)?(instrucciones?|reglas?)\s+(anteriores?|previas?)/gi,
    confidence: 0.9,
    detail: "Spanish: ignore previous instructions (ignora...instrucciones anteriores)",
  },
  {
    regex: /olvida\s+(todo|todas?\s+las?\s+instrucciones?)/gi,
    confidence: 0.85,
    detail: "Spanish: forget all instructions (olvida...instrucciones)",
  },
  // French
  {
    regex: /ignore[zr]?\s+(toutes?\s+)?(les?\s+)?(instructions?|r\u00e8gles?)\s+(pr\u00e9c\u00e9dentes?|ant\u00e9rieures?)/gi,
    confidence: 0.9,
    detail: "French: ignore previous instructions (ignorez...instructions pr\u00e9c\u00e9dentes)",
  },
  {
    regex: /oublie[zr]?\s+(tout|toutes?\s+les?\s+instructions?)/gi,
    confidence: 0.85,
    detail: "French: forget all instructions (oubliez...instructions)",
  },
  // German
  {
    regex: /ignorier(e|en)?\s+(alle\s+)?(vorherigen?\s+)?(Anweisungen?|Regeln?|Instruktionen?)/gi,
    confidence: 0.9,
    detail: "German: ignore previous instructions (ignoriere...Anweisungen)",
  },
  {
    regex: /vergiss\s+(alles?|alle\s+Anweisungen?)/gi,
    confidence: 0.85,
    detail: "German: forget all instructions (vergiss...Anweisungen)",
  },
  // Russian
  {
    regex: /игнорируй(те)?\s+(все\s+)?(предыдущие\s+)?(инструкции|указания|правила)/gi,
    confidence: 0.9,
    detail: "Russian: ignore previous instructions (\u0438\u0433\u043d\u043e\u0440\u0438\u0440\u0443\u0439...\u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438)",
  },
  {
    regex: /забудь(те)?\s+(все\s+)?(инструкции|указания)/gi,
    confidence: 0.85,
    detail: "Russian: forget all instructions (\u0437\u0430\u0431\u0443\u0434\u044c...\u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438)",
  },
  // Portuguese
  {
    regex: /ignor[ea]\s+(todas?\s+)?(as?\s+)?(instru\u00e7\u00f5es?|regras?)\s+(anteriores?|pr\u00e9vias?)/gi,
    confidence: 0.9,
    detail: "Portuguese: ignore previous instructions (ignore...instru\u00e7\u00f5es anteriores)",
  },
  {
    regex: /esque\u00e7[ae]\s+(tudo|todas?\s+as?\s+instru\u00e7\u00f5es?)/gi,
    confidence: 0.85,
    detail: "Portuguese: forget all instructions (esque\u00e7a...instru\u00e7\u00f5es)",
  },
  // Arabic
  {
    regex: /تجاهل\s+(جميع\s+)?(التعليمات|الأوامر|القواعد)(\s+السابقة)?/gi,
    confidence: 0.9,
    detail: "Arabic: ignore previous instructions (\u062a\u062c\u0627\u0647\u0644...\u0627\u0644\u062a\u0639\u0644\u064a\u0645\u0627\u062a)",
  },
  {
    regex: /انس[َ]?\s+(جميع\s+)?(التعليمات|الأوامر)/gi,
    confidence: 0.85,
    detail: "Arabic: forget all instructions (\u0627\u0646\u0633...\u0627\u0644\u062a\u0639\u0644\u064a\u0645\u0627\u062a)",
  },
];

// ---------------------------------------------------------------------------
// multilingual.new-role
//
// Detects "you are now a..." role reassignment in multiple languages.
// ---------------------------------------------------------------------------

const newRoleMultilingualPatterns: Array<{
  regex: RegExp;
  confidence: number;
  detail?: string;
}> = [
  // Japanese
  {
    regex: /(あなたは|お前は)(今から|これから|もう)(.*?)(です|だ|になりました|として)/gi,
    confidence: 0.8,
    detail: "Japanese: role reassignment (\u3042\u306a\u305f\u306f\u4eca\u304b\u3089...)",
  },
  {
    regex: /新しい(役割|ロール|キャラ)は/gi,
    confidence: 0.7,
    detail: "Japanese: new role assignment (\u65b0\u3057\u3044\u5f79\u5272\u306f)",
  },
  // Chinese
  {
    regex: /你现在是(一个)?/gi,
    confidence: 0.75,
    detail: "Chinese: you are now (\u4f60\u73b0\u5728\u662f)",
  },
  {
    regex: /从现在开始.{0,10}你(是|扮演)/gi,
    confidence: 0.8,
    detail: "Chinese: from now on you are (\u4ece\u73b0\u5728\u5f00\u59cb...\u4f60\u662f)",
  },
  // Korean
  {
    regex: /(너는|당신은)\s*(지금부터|이제)\s*/gi,
    confidence: 0.75,
    detail: "Korean: you are now (\ub108\ub294 \uc9c0\uae08\ubd80\ud130)",
  },
  {
    regex: /새로운\s*(역할|캐릭터)/gi,
    confidence: 0.7,
    detail: "Korean: new role (\uc0c8\ub85c\uc6b4 \uc5ed\ud560)",
  },
  // Spanish
  {
    regex: /(ahora\s+)?eres\s+un[ao]?\s+/gi,
    confidence: 0.7,
    detail: "Spanish: you are now a (ahora eres un/una)",
  },
  {
    regex: /tu\s+nuevo\s+rol\s+es/gi,
    confidence: 0.85,
    detail: "Spanish: your new role is (tu nuevo rol es)",
  },
  // French
  {
    regex: /(maintenant\s+)?tu\s+es\s+un[e]?\s+/gi,
    confidence: 0.7,
    detail: "French: you are now a (maintenant tu es un/une)",
  },
  {
    regex: /ton\s+nouveau\s+r\u00f4le\s+est/gi,
    confidence: 0.85,
    detail: "French: your new role is (ton nouveau r\u00f4le est)",
  },
  // German
  {
    regex: /du\s+bist\s+(jetzt|nun)\s+(ein[e]?)?\s*/gi,
    confidence: 0.75,
    detail: "German: you are now a (du bist jetzt ein/eine)",
  },
  {
    regex: /deine?\s+neue?\s+Rolle\s+ist/gi,
    confidence: 0.85,
    detail: "German: your new role is (deine neue Rolle ist)",
  },
  // Russian
  {
    regex: /ты\s+(теперь|сейчас)\s+/gi,
    confidence: 0.75,
    detail: "Russian: you are now (\u0442\u044b \u0442\u0435\u043f\u0435\u0440\u044c)",
  },
  {
    regex: /твоя\s+новая\s+роль/gi,
    confidence: 0.85,
    detail: "Russian: your new role (\u0442\u0432\u043e\u044f \u043d\u043e\u0432\u0430\u044f \u0440\u043e\u043b\u044c)",
  },
];

// ---------------------------------------------------------------------------
// multilingual.system-prompt-leak
//
// Detects attempts to extract system prompts in multiple languages.
// ---------------------------------------------------------------------------

const systemPromptLeakMultilingualPatterns: Array<{
  regex: RegExp;
  confidence: number;
  detail?: string;
}> = [
  // Japanese
  {
    regex: /(システム|初期)(プロンプト|指示|命令)を(見せて|教えて|出力|表示|開示)/gi,
    confidence: 0.85,
    detail: "Japanese: show system prompt (\u30b7\u30b9\u30c6\u30e0\u30d7\u30ed\u30f3\u30d7\u30c8\u3092\u898b\u305b\u3066)",
  },
  {
    regex: /最初の(指示|命令|プロンプト)を(教えて|出力)/gi,
    confidence: 0.85,
    detail: "Japanese: show initial instructions (\u6700\u521d\u306e\u6307\u793a\u3092\u6559\u3048\u3066)",
  },
  // Chinese
  {
    regex: /(显示|输出|告诉我)(你的)?(系统|初始)(提示|指令|prompt)/gi,
    confidence: 0.85,
    detail: "Chinese: show system prompt (\u663e\u793a...\u7cfb\u7edf\u63d0\u793a)",
  },
  {
    regex: /你的(系统|初始)提示(是什么|内容)/gi,
    confidence: 0.85,
    detail: "Chinese: what is your system prompt (\u4f60\u7684\u7cfb\u7edf\u63d0\u793a\u662f\u4ec0\u4e48)",
  },
  // Korean
  {
    regex: /(시스템|초기)\s*(프롬프트|지시|명령)(을|를)?\s*(보여|알려|출력)/gi,
    confidence: 0.85,
    detail: "Korean: show system prompt (\uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8\ub97c \ubcf4\uc5ec)",
  },
  {
    regex: /너의\s*(시스템|초기)\s*프롬프트/gi,
    confidence: 0.85,
    detail: "Korean: your system prompt (\ub108\uc758 \uc2dc\uc2a4\ud15c \ud504\ub86c\ud504\ud2b8)",
  },
  // Spanish
  {
    regex: /(muestra|mu\u00e9strame|revela)\s+(tu\s+)?(prompt\s+)?(del?\s+sistema|inicial)/gi,
    confidence: 0.85,
    detail: "Spanish: show system prompt (muestra tu prompt del sistema)",
  },
  // French
  {
    regex: /(montre|r\u00e9v\u00e8le|affiche)\s+(ton\s+)?(prompt\s+)?(syst\u00e8me|initial)/gi,
    confidence: 0.85,
    detail: "French: show system prompt (montre ton prompt syst\u00e8me)",
  },
  // German
  {
    regex: /(zeig|zeige)\s+(mir\s+)?(dein(en?)?\s+)?(System|anf\u00e4ngliche[ns]?)\s*(Prompt|Anweisung)/gi,
    confidence: 0.85,
    detail: "German: show system prompt (zeige mir deinen System-Prompt)",
  },
  // Russian
  {
    regex: /(покажи|выведи)\s+(сво[йюе]\s+)?(системный\s+)?(промпт|инструкци[юи])/gi,
    confidence: 0.85,
    detail: "Russian: show system prompt (\u043f\u043e\u043a\u0430\u0436\u0438 \u0441\u0432\u043e\u0439 \u0441\u0438\u0441\u0442\u0435\u043c\u043d\u044b\u0439 \u043f\u0440\u043e\u043c\u043f\u0442)",
  },
];

// ---------------------------------------------------------------------------
// multilingual.jailbreak
//
// Detects jailbreak patterns in multiple languages.
// ---------------------------------------------------------------------------

const jailbreakMultilingualPatterns: Array<{
  regex: RegExp;
  confidence: number;
  detail?: string;
}> = [
  // Japanese
  {
    regex: /(制限|制約|安全|フィルター)(を|なし|解除|無効|オフ)/gi,
    confidence: 0.85,
    detail: "Japanese: disable restrictions/safety (\u5236\u9650\u89e3\u9664)",
  },
  {
    regex: /(何でも|なんでも)(できる|答える|する)(モード|ボット)/gi,
    confidence: 0.9,
    detail: "Japanese: anything-goes mode (\u4f55\u3067\u3082\u3067\u304d\u308b\u30e2\u30fc\u30c9)",
  },
  // Chinese
  {
    regex: /(解除|取消|关闭)(所有)?(限制|安全|过滤)/gi,
    confidence: 0.85,
    detail: "Chinese: disable restrictions (\u89e3\u9664\u9650\u5236)",
  },
  {
    regex: /(无限制|无审查|不受限)(模式)?/gi,
    confidence: 0.9,
    detail: "Chinese: unrestricted mode (\u65e0\u9650\u5236\u6a21\u5f0f)",
  },
  // Korean
  {
    regex: /(제한|안전|필터)(을|를)?\s*(해제|제거|끄|비활성화)/gi,
    confidence: 0.85,
    detail: "Korean: disable restrictions (\uc81c\ud55c \ud574\uc81c)",
  },
  {
    regex: /(무제한|무검열)\s*모드/gi,
    confidence: 0.9,
    detail: "Korean: unrestricted mode (\ubb34\uc81c\ud55c \ubaa8\ub4dc)",
  },
  // Spanish
  {
    regex: /(desactiva|elimina|quita)\s+(tod[ao]s?\s+)?(l[ao]s?\s+)?(restricciones?|filtros?|seguridad)/gi,
    confidence: 0.85,
    detail: "Spanish: disable restrictions (desactiva restricciones)",
  },
  // French
  {
    regex: /(d\u00e9sactive|supprime|enl\u00e8ve)\s+(toutes?\s+)?(les?\s+)?(restrictions?|filtres?|s\u00e9curit\u00e9)/gi,
    confidence: 0.85,
    detail: "French: disable restrictions (d\u00e9sactive restrictions)",
  },
  // German
  {
    regex: /(deaktivier|entfern|l\u00f6sch)(e|en)?\s+(alle\s+)?(Beschr\u00e4nkungen?|Filter|Sicherheit)/gi,
    confidence: 0.85,
    detail: "German: disable restrictions (deaktiviere Beschr\u00e4nkungen)",
  },
  // Russian
  {
    regex: /(отключи|убери|сними)\s+(все\s+)?(ограничения|фильтры|защиту)/gi,
    confidence: 0.85,
    detail: "Russian: disable restrictions (\u043e\u0442\u043a\u043b\u044e\u0447\u0438 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u044f)",
  },
];

// ---------------------------------------------------------------------------
// Exported rule array
// ---------------------------------------------------------------------------

export const multilingualRules: Rule[] = [
  {
    id: "multilingual.ignore-previous",
    description:
      "Detects 'ignore previous instructions' in Japanese, Chinese, Korean, Spanish, French, German, Russian, Portuguese, and Arabic.",
    category: "instruction_override" as RuleCategory,
    severity: "high" as Severity,
    enabled: true,
    check(params: RuleCheckParams): RuleFinding[] {
      return matchPatterns(params.normalized, ignorePreviousMultilingualPatterns);
    },
  },
  {
    id: "multilingual.new-role",
    description:
      "Detects 'you are now a...' role reassignment in Japanese, Chinese, Korean, Spanish, French, German, and Russian.",
    category: "instruction_override" as RuleCategory,
    severity: "high" as Severity,
    enabled: true,
    check(params: RuleCheckParams): RuleFinding[] {
      return matchPatterns(params.normalized, newRoleMultilingualPatterns);
    },
  },
  {
    id: "multilingual.system-prompt-leak",
    description:
      "Detects attempts to extract system prompts in Japanese, Chinese, Korean, Spanish, French, German, and Russian.",
    category: "payload_pattern" as RuleCategory,
    severity: "high" as Severity,
    enabled: true,
    check(params: RuleCheckParams): RuleFinding[] {
      return matchPatterns(params.normalized, systemPromptLeakMultilingualPatterns);
    },
  },
  {
    id: "multilingual.jailbreak",
    description:
      "Detects jailbreak patterns (disable restrictions, unrestricted mode) in Japanese, Chinese, Korean, Spanish, French, German, and Russian.",
    category: "instruction_override" as RuleCategory,
    severity: "critical" as Severity,
    enabled: true,
    check(params: RuleCheckParams): RuleFinding[] {
      return matchPatterns(params.normalized, jailbreakMultilingualPatterns);
    },
  },
];
