#!/usr/bin/env python3
"""
改进版：将单空填空题转换为选择题
- 只转换单空填空题（answer 数组长度 == 1）
- 多空填空题直接删除（不转换）
- 保留所有 choice 和 judge 类型题目不变
- 干扰项生成更智能：优先从同章节答案中选取，类型匹配
- 题目内容中的 ____ 替换为（  ）
- 选项数量固定为4个（1个正确 + 3个干扰）
"""
import json
import random
import re
import os

random.seed(42)  # 确保可复现

# 路径配置
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, '..', 'public', 'data', 'history-grade7-complete.json')

# 读取题库
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    questions = json.load(f)

# ============================================================
# 1. 分类题目
# ============================================================
choice_questions = []
judge_questions = []
single_fill_questions = []  # 单空填空题（将被转换）
multi_fill_questions = []   # 多空填空题（将被删除）

for q in questions:
    t = q.get('type', '')
    if t == 'choice':
        choice_questions.append(q)
    elif t == 'judge':
        judge_questions.append(q)
    elif t == 'fill':
        ans = q.get('answer', [])
        if isinstance(ans, list) and len(ans) == 1:
            single_fill_questions.append(q)
        else:
            multi_fill_questions.append(q)
    else:
        # 未知类型，保留原样
        choice_questions.append(q)

# ============================================================
# 2. 构建干扰项资源池
# ============================================================

# 按章节分组收集所有答案
chapter_answers = {}  # chapter_tag -> list of answers
all_answers = set()

for q in questions:
    if q.get('type') == 'fill':
        tags = q.get('tags', [])
        chapter = None
        for tag in tags:
            if re.match(r'第\d+课', tag):
                chapter = tag
                break
        if chapter is None:
            chapter = '其他'
        for ans in q.get('answer', []):
            all_answers.add(ans)
            if chapter not in chapter_answers:
                chapter_answers[chapter] = []
            chapter_answers[chapter].append(ans)

# 也从选择题的选项中收集答案（更丰富的干扰项来源）
for q in questions:
    if q.get('type') == 'choice':
        tags = q.get('tags', [])
        chapter = None
        for tag in tags:
            if re.match(r'第\d+课', tag):
                chapter = tag
                break
        if chapter is None:
            chapter = '其他'
        for opt in q.get('options', []):
            all_answers.add(opt)
            if chapter not in chapter_answers:
                chapter_answers[chapter] = []
            chapter_answers[chapter].append(opt)

# ============================================================
# 3. 答案类型分类函数
# ============================================================

def classify_answer(answer):
    """
    判断答案的类型，返回类别标签。
    类别: 'number', 'person', 'place', 'dynasty', 'event', 'concept', 'other'
    """
    if re.match(r'^[\d]+\.?\d*$', answer):
        return 'number'
    if re.match(r'^[\d]+[多余]?年?$', answer):
        return 'number'
    if re.match(r'^公元前?\d+', answer):
        return 'number'
    if re.match(r'^公元\d+', answer):
        return 'number'

    # 人名关键词
    person_keywords = ['人', '帝', '王', '皇', '祖', '宗', '公', '侯', '相',
                       '将', '臣', '妃', '后', '子', '夫', '氏', '孔子',
                       '老子', '墨子', '韩非子', '孟子', '庄子', '荀子',
                       '孙武', '孙膑', '张衡', '华佗', '张仲景', '司马迁',
                       '蔡伦', '毕昇', '李白', '杜甫', '白居易', '苏轼',
                       '曹操', '刘备', '孙权', '诸葛亮', '周瑜', '关羽',
                       '秦始皇', '汉武帝', '汉高祖', '唐太宗', '宋太祖',
                       '尧', '舜', '禹', '启', '桀', '纣', '汤', '武王',
                       '盘庚', '周文王', '屈原', '司马炎', '苻坚', '谢安',
                       '王羲之', '顾恺之', '贾思勰', '郦道元', '祖冲之',
                       '胡亥', '赵高', '陈胜', '吴广', '项羽', '刘邦',
                       '董仲舒', '卫青', '霍去病', '张骞', '班超',
                       '匈奴', '鲜卑', '氐', '羌', '羯', '氐人', '羌人']
    for kw in person_keywords:
        if kw in answer:
            return 'person'

    # 地名关键词
    place_keywords = ['京', '都', '城', '州', '府', '郡', '县', '镇',
                       '山', '河', '江', '湖', '海', '关', '原', '谷',
                       '中原', '关中', '江南', '河西', '西域', '河姆渡',
                       '半坡', '殷墟', '阳城', '镐京', '咸阳', '长安',
                       '洛阳', '建康', '南京', '开封', '杭州', '临安',
                       '大都', '北京', '印度', '西域', '草原', '成都',
                       '郢', '彭城', '赤壁', '官渡', '夷陵', '涿鹿',
                       '牧野', '阪泉', '涿鹿', '龙骨山', '周口店']
    for kw in place_keywords:
        if kw in answer:
            return 'place'

    # 朝代关键词
    dynasty_keywords = ['朝', '代', '夏', '商', '周', '秦', '汉', '晋',
                        '隋', '唐', '宋', '元', '明', '清', '三国',
                        '南北朝', '五代', '十国', '春秋', '战国',
                        '西周', '东周', '西汉', '东汉', '西晋', '东晋',
                        '南朝', '北朝', '蜀汉', '曹魏', '东吴']
    for kw in dynasty_keywords:
        if kw in answer and len(answer) <= 6:
            return 'dynasty'

    # 制度/概念类
    concept_keywords = ['制', '制度', '政策', '改革', '变法', '科举',
                        '分封', '郡县', '禅让', '世袭', '井田',
                        '统一', '分裂', '兼并', '争霸', '变法',
                        '丝绸之路', '大运河', '长城', '灵渠',
                        '太学', '郡国', '推恩', '盐铁', '独尊',
                        '焚书', '坑儒', '造纸', '印刷', '火药',
                        '指南针', '造纸术', '活字印刷术',
                        '都护', '刺史', '州牧', '尚书', '御史',
                        '屯田', '均田', '租庸调', '两税法',
                        '五禽戏', '麻沸散', '伤寒杂病论',
                        '史记', '汉书', '资治通鉴',
                        '草船借箭', '赤壁之战', '官渡之战',
                        '夷陵之战', '涿鹿之战', '牧野之战',
                        '阪泉之战', '巨鹿之战', '城濮之战',
                        '马陵之战', '桂陵之战', '长平之战']

    return 'other'


# ============================================================
# 4. 智能干扰项生成
# ============================================================

# 通用干扰项（按类型分组，作为兜底）
generic_distractors = {
    'number': ['100', '200', '300', '500', '1000', '2000', '3000', '5000',
               '公元前1046', '公元前221', '公元前202', '公元前138',
               '208', '230', '263', '280', '316', '383', '60', '170',
               '70', '3', '4000多', '2070', '771', '1046', '475', '221',
               '202', '9', '25', '200多'],
    'person': ['孔子', '老子', '墨子', '韩非子', '孟子', '庄子',
               '秦始皇', '汉武帝', '周武王', '商汤', '大禹',
               '张骞', '司马迁', '蔡伦', '华佗', '张仲景',
               '曹操', '刘备', '孙权', '诸葛亮', '董仲舒',
               '卫青', '霍去病', '班超', '王羲之', '顾恺之',
               '祖冲之', '贾思勰', '郦道元', '屈原', '陈胜',
               '吴广', '项羽', '刘邦', '李冰', '蒙恬'],
    'place': ['长安', '洛阳', '咸阳', '镐京', '阳城', '殷墟',
              '南京', '开封', '杭州', '成都', '关中', '江南',
              '中原', '西域', '河姆渡', '半坡', '周口店',
              '龙骨山', '赤壁', '官渡', '牧野', '涿鹿',
              '印度', '大宛', '西域', '匈奴', '临安', '大都'],
    'dynasty': ['夏朝', '商朝', '西周', '东周', '秦朝', '西汉',
                '东汉', '三国', '西晋', '东晋', '南北朝', '隋朝',
                '唐朝', '宋朝', '元朝', '明朝', '清朝',
                '春秋', '战国', '蜀汉', '曹魏', '东吴'],
    'other': ['分封制', '郡县制', '科举制', '三省六部制',
              '禅让制', '世袭制', '井田制', '均田制',
              '丝绸之路', '大运河', '长城', '灵渠',
              '太学', '郡国并行制', '推恩令', '盐铁专营',
              '焚书坑儒', '独尊儒术', '造纸术', '五禽戏',
              '麻沸散', '史记', '伤寒杂病论', '草船借箭',
              '赤壁之战', '官渡之战', '牧野之战', '涿鹿之战',
              '打制石器', '磨制石器', '干栏式', '半地穴式',
              '水稻', '粟', '黍', '双季稻', '贫富分化',
              '私有制', '阶级', '国家', '甲骨文', '金文',
              '小篆', '隶书', '楷书', '行书', '草书',
              '浑天仪', '地动仪', '水排', '耧车', '都江堰',
              '西域都护', '刺史', '州牧', '尚书台',
              '屯田制', '九品中正制', '夷陵之战', '巨鹿之战']
}


def get_chapter_for_question(q):
    """获取题目所属的章节标签"""
    tags = q.get('tags', [])
    for tag in tags:
        if re.match(r'第\d+课', tag):
            return tag
    return None


def format_consistent(answer, candidate):
    """
    检查干扰项与正确答案的格式是否一致。
    对数字类型：纯数字对纯数字，带前缀的对带前缀的
    """
    ans_is_pure_number = bool(re.match(r'^\d+$', answer))
    cand_is_pure_number = bool(re.match(r'^\d+$', candidate))
    if ans_is_pure_number and not cand_is_pure_number:
        return False
    if not ans_is_pure_number and cand_is_pure_number:
        return False
    # 长度差异不能太大（不超过3倍）
    if len(candidate) > len(answer) * 3 + 2:
        return False
    if len(answer) > len(candidate) * 3 + 2:
        return False
    return True


def generate_smart_distractors(answer, question, chapter_answers_map, all_ans_set):
    """
    智能生成干扰项：
    1. 优先从同章节的其他答案中选取
    2. 干扰项类型要和正确答案类型匹配
    3. 干扰项格式与正确答案一致
    4. 如果找不到同类干扰项，使用通用干扰项
    """
    ans_type = classify_answer(answer)
    chapter = get_chapter_for_question(question)

    distractors = []

    # 策略1：从同章节答案中找同类型的干扰项
    if chapter and chapter in chapter_answers_map:
        same_chapter = chapter_answers_map[chapter]
        type_matched = [a for a in same_chapter
                        if a != answer
                        and classify_answer(a) == ans_type
                        and len(a) <= 15
                        and format_consistent(answer, a)]
        random.shuffle(type_matched)
        for a in type_matched:
            if a not in distractors and len(distractors) < 3:
                distractors.append(a)

    # 策略2：从其他章节答案中找同类型的干扰项
    if len(distractors) < 3:
        other_chapter_answers = []
        for ch, ans_list in chapter_answers_map.items():
            if ch != chapter:
                other_chapter_answers.extend(ans_list)
        type_matched = [a for a in other_chapter_answers
                        if a != answer
                        and classify_answer(a) == ans_type
                        and len(a) <= 15
                        and format_consistent(answer, a)]
        random.shuffle(type_matched)
        for a in type_matched:
            if a not in distractors and len(distractors) < 3:
                distractors.append(a)

    # 策略3：从所有答案中找同类型的干扰项
    if len(distractors) < 3:
        type_matched = [a for a in all_ans_set
                        if a != answer
                        and classify_answer(a) == ans_type
                        and len(a) <= 15
                        and format_consistent(answer, a)]
        random.shuffle(type_matched)
        for a in type_matched:
            if a not in distractors and len(distractors) < 3:
                distractors.append(a)

    # 策略4：使用通用干扰项
    if len(distractors) < 3:
        fallback = generic_distractors.get(ans_type, generic_distractors['other'])
        random.shuffle(fallback)
        for d in fallback:
            if d not in distractors and d != answer and format_consistent(answer, d) and len(distractors) < 3:
                distractors.append(d)

    # 最终兜底：如果还是不够，从所有答案中随机取
    if len(distractors) < 3:
        remaining = [a for a in all_ans_set if a != answer and a not in distractors and len(a) <= 15]
        random.shuffle(remaining)
        for a in remaining:
            if len(distractors) < 3:
                distractors.append(a)

    return distractors[:3]


# ============================================================
# 5. 执行转换
# ============================================================

converted_questions = []
converted_count = 0
deleted_multi_fill_count = 0

def has_containment_relation(a, b):
    """检查两个答案是否存在包含关系"""
    return (a in b) or (b in a)


for q in single_fill_questions:
    answer = q['answer'][0]

    # 生成干扰项
    distractors = generate_smart_distractors(answer, q, chapter_answers, all_answers)

    # 过滤掉与正确答案有包含关系的干扰项
    distractors = [d for d in distractors if not has_containment_relation(answer, d)]

    # 如果过滤后不够3个，补充通用干扰项
    if len(distractors) < 3:
        ans_type = classify_answer(answer)
        fallback = generic_distractors.get(ans_type, generic_distractors['other'])
        random.shuffle(fallback)
        for d in fallback:
            if d not in distractors and d != answer and not has_containment_relation(answer, d):
                distractors.append(d)
            if len(distractors) >= 3:
                break

    # 构建选项（正确答案 + 3个干扰项）
    options = [answer] + distractors[:3]
    random.shuffle(options)

    # 找到正确答案的索引
    correct_index = options.index(answer)

    # 替换题目内容中的 ____ 为（  ）
    content = q['content'].replace('____', '（  ）')

    # 构建新题目
    new_q = {
        'id': q['id'] + '-c',  # 添加 -c 后缀表示从填空转换而来
        'type': 'choice',
        'content': content,
        'options': options,
        'answer': correct_index,
        'explanation': q.get('explanation', ''),
        'difficulty': q.get('difficulty', 1),
        'tags': q.get('tags', [])
    }
    converted_questions.append(new_q)
    converted_count += 1

# ============================================================
# 6. 组装最终题库
# ============================================================

final_questions = choice_questions + judge_questions + converted_questions

# 重新编号 ID（保持一致性）
for i, q in enumerate(final_questions):
    q['_order'] = i  # 临时排序字段，最后会删除

# 按 type 排序：choice 在前，judge 在后
final_questions.sort(key=lambda x: (0 if x['type'] == 'choice' else 1, x.get('_order', 0)))

# 删除临时排序字段
for q in final_questions:
    if '_order' in q:
        del q['_order']

# ============================================================
# 7. 保存结果
# ============================================================

with open(DATA_FILE, 'w', encoding='utf-8') as f:
    json.dump(final_questions, f, ensure_ascii=False, indent=2)

# ============================================================
# 8. 输出统计报告
# ============================================================

print("=" * 60)
print("转换报告")
print("=" * 60)
print("")
print("【转换前】")
print("  选择题 (choice):    %d 道" % len(choice_questions))
print("  判断题 (judge):     %d 道" % len(judge_questions))
print("  填空题 (fill):      %d 道" % (len(single_fill_questions) + len(multi_fill_questions)))
print("    - 单空填空:       %d 道（将被转换）" % len(single_fill_questions))
print("    - 多空填空:       %d 道（将被删除）" % len(multi_fill_questions))
print("  总计:               %d 道" % len(questions))
print("")
print("【转换后】")
print("  原选择题 (choice):  %d 道（保持不变）" % len(choice_questions))
print("  原判断题 (judge):   %d 道（保持不变）" % len(judge_questions))
print("  新选择题 (转换):    %d 道（由单空填空转换）" % converted_count)
print("  删除的多空填空:     %d 道" % len(multi_fill_questions))
print("  总计:               %d 道" % len(final_questions))
print("")
print("【改进点】")
print("  1. 只转换单空填空题，多空填空题直接删除")
print("  2. 干扰项优先从同章节答案中选取")
print("  3. 干扰项类型与正确答案类型匹配（数字/人名/地名/朝代/其他）")
print("  4. 四层干扰项生成策略，确保质量")
print("  5. ____ 替换为（  ）")
print("  6. 选项固定为4个（1正确+3干扰）")
print("")
print("=" * 60)
