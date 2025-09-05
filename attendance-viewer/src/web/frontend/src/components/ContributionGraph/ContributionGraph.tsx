import React from 'react';
import './ContributionGraph.css';

// コンポーネントのプロパティの型定義
interface ContributionGraphProps {
    userName : string;
    year     : number;
    dailyData: { [date: string]: number };
}

const MONTH_LABELS  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKS_TO_SHOW = 53;

const getColorForTime = (minutes: number): string => {
    if (minutes > 480) return 'color-level-4'; // 8時間以上
    if (minutes > 360) return 'color-level-3'; // 6時間以上
    if (minutes > 240) return 'color-level-2'; // 4時間以上
    if (minutes > 120) return 'color-level-1'; // 2時間以上
    return 'color-level-0';                    // 2時間未満
};

// タイムゾーン問題を回避して 'YYYY-MM-DD' 形式の文字列を生成する関数
const toISODateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const ContributionGraph: React.FC<ContributionGraphProps> = ({ year, dailyData, userName }) => {
    const getCalendarData = () => {
        const weeks: Date[][]                                         = [];
        const monthLabelPositions: { label: string; index: number }[] = [];
        const firstDayOfYear                                          = new Date(year, 0, 1);
        const dayOfWeek                                               = firstDayOfYear.getDay();

        // 1月1日の前の日曜日を計算
        const startDate = new Date(firstDayOfYear);
        startDate.setDate(firstDayOfYear.getDate() - dayOfWeek);
        let lastMonth   = -1;
        let currentDate = new Date(startDate);

        // 1年分の週を生成
        for (let weekIndex = 0; weekIndex < WEEKS_TO_SHOW; weekIndex++) {
            const currentWeek: Date[] = [];
            // 1週間分の日付を追加
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                currentWeek.push(new Date(currentDate));
                // 月のラベルを追加
                if (currentDate.getFullYear() === year && currentDate.getMonth() !== lastMonth) {
                    monthLabelPositions.push({ label: MONTH_LABELS[currentDate.getMonth()], index: weekIndex });
                    lastMonth = currentDate.getMonth();
                }
                // 日付を1日進める
                currentDate.setDate(currentDate.getDate() + 1);
            }
            // 週を追加
            weeks.push(currentWeek);
        }
        return { weeks, monthLabelPositions };
    };

    const { weeks, monthLabelPositions } = getCalendarData();

    return (
        <div className="graph-container-yearly">
            <h3 className="graph-title">{userName} - {year}年</h3>
            <div className="graph-grid">
                <div className="months-row">
                    {monthLabelPositions.map(({ label, index }) => (
                        <div key={label} className="month-label" style={{ gridColumnStart: index + 1 }}>
                            {label}
                        </div>
                    ))}
                </div>
                <div className="days-and-cells">
                    <div className="days-col">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                    </div>
                    <div className="cells-grid">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="week-col">
                                {week.map((date, dayIndex) => {
                                    if (date.getFullYear() !== year) {
                                        return <div key={dayIndex} className="cell empty" />;
                                    }

                                    // タイムゾーン問題を回避する関数を使用
                                    const dateString = toISODateString(date);
                                    const minutes    = dailyData[dateString] || 0;
                                    const colorClass = getColorForTime(minutes);
                                    const title      = `${dateString}\n滞在時間: ${minutes}分`;

                                    return <div key={dayIndex} className={`cell ${colorClass}`} title={title} />;
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="legend">
                <span>Less</span>
                    <div className="cell color-level-0"></div>
                    <div className="cell color-level-1"></div>
                    <div className="cell color-level-2"></div>
                    <div className="cell color-level-3"></div>
                    <div className="cell color-level-4"></div>
                <span>More</span>
            </div>
        </div>
    );
};

// 小さなインライン版のContributionGraphコンポーネント
interface MiniContributionGraphProps {
    attendanceData: { [date: string]: number };
    className?: string;
}

export const MiniContributionGraph: React.FC<MiniContributionGraphProps> = ({attendanceData, className = ''}) => {
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    const getIntensity = (hours: number) => {
        if (hours === 0) return 0;
        if (hours <= 2) return 1;
        if (hours <= 4) return 2;
        if (hours <= 6) return 3;
        return 4;
    };

    const last7Days = getLast7Days();

    return (
        <div className={`mini-contribution-graph ${className}`}>
            {last7Days.map((date) => {
                const hours = attendanceData[date] || 0;
                const intensity = getIntensity(hours);
                return (
                    <div
                        key={date}
                        className={`mini-day color-level-${intensity}`}
                        title={`${date}: ${hours.toFixed(1)}時間`}
                    />
                );
            })}
        </div>
    );
};

export default ContributionGraph;