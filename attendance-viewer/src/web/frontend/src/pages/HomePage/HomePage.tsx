import React, { useState, useEffect, useMemo }                 from 'react';
import { useLocation, useNavigate, Link }                      from "react-router-dom";
import type { User, UserStatus, UserIdentifier, FullUserInfo } from '../../types/attendance';
import { useGetSnapshot }                                      from '../../hooks/useGetSnapshot';
import { useAttendanceSocket }                                 from '../../hooks/useAttendanceSocket';
import Modal                                                   from '../../components/Modal/Modal';
import ContributionGraph                                       from '../../components/ContributionGraph/ContributionGraph';
import './HomePage.css';

// 在室状況の表示用ステータス
type DisplayStatus                    = '在室' | '休憩中' | '退室';
const STATUS_COLUMNS: DisplayStatus[] = ['在室', '休憩中', '退室'];

// APIからのステータスを表示用のステータスにマッピングする関数
const mapApiStatusToDisplayStatus = (apiStatus: UserStatus): DisplayStatus | null => {
    switch (apiStatus) {
        case 'clock_in':
        case 'break_out':
            return '在室';
        case 'break_in':
            return '休憩中';
        case 'clock_out':
            return '退室';
        default:
            return null;
    }
};

// ステータスに応じて色を返す関数
const getStatusColorClass = (status: DisplayStatus): string => {
    switch (status) {
        case '在室'  : return 'present';
        case '休憩中': return 'away';
        case '退室'  : return 'left';
        default:
            return 'unknown';
    }
};

// 学年に応じて行のクラスを返す関数
const getGradeRowClass = (grade: string): string => {
    switch (grade) {
        case 'B3': return 'grade-b3';
        case 'B4': return 'grade-b4';
        case 'M1': return 'grade-m1';
        case 'M2': return 'grade-m2';
        case 'RS': return 'grade-researcher';
        default: return '';
    }
};

const toISODateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// 日付をYYYY-MM-DD形式の文字列にフォーマットするヘルパー関数
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// ホームページコンポーネント
const HomePage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // ローディングページから渡された状態を取得
    const passedState = location.state as {
        attendanceUsers?: User[];
        allUsers?: UserIdentifier[];
    } | null;
    // 現在の時刻を管理するステート
    const [currentTime, setCurrentTime] = useState(new Date());

    // グラフ表示用モーダルのためのステート
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [selectedUser, setSelectedUser] = useState<FullUserInfo | null>(null);
    const [startDate, setStartDate]       = useState('');
    const [endDate, setEndDate]           = useState('');

    // グラフ用データ取得フックを追加
    const {
        snapshotData,
        isLoading: isSnapshotLoading,
        error: snapshotError,
    } = useGetSnapshot(startDate, endDate, selectedUser?.name);

    // LoadingPageから渡された2つのリストを結合して，初期ユーザーリストを作成
    const initialUsers = useMemo(() => {
        if (!passedState?.allUsers) return [];

        const attendanceStatusMap = new Map(
            passedState.attendanceUsers?.map(u => [u.name, u.status])
        );

        // allUsersリストとattendanceUsersリストを結合し，ステータスをマッピング
        const combinedUsers: FullUserInfo[] = passedState.allUsers.map(user => ({
            name  : user.name,
            grade : user.grade,
            status: attendanceStatusMap.get(user.name) || 'clock_out'
        }));

        return combinedUsers;
    }, [passedState]);

    // リアルタイムで更新されるユーザーリストを取得するカスタムフック
    const { users: realTimeUsers, error: socketError } = useAttendanceSocket(initialUsers);

    // ユーザーリストを学年と名前でソートするメモ化された値
    const sortedUsers = useMemo(() => {
        const gradeSortOrder: { [key: string]: number } = { 'RS': 0, 'M2': 1, 'M1': 2, 'B4': 3, 'B3': 4 };
        return [...realTimeUsers].sort((a, b) => {
            const gradeOrderA = gradeSortOrder[a.grade] ?? 99;
            const gradeOrderB = gradeSortOrder[b.grade] ?? 99;
            if (gradeOrderA !== gradeOrderB) {
                return gradeOrderA - gradeOrderB;
            }
            return a.name.localeCompare(b.name, 'ja');
        });
    }, [realTimeUsers]);

    // currentYearかselectedUserが変更されたら，API用の日付を更新
    useEffect(() => {
        if (selectedUser) {
            const currentYear = new Date().getFullYear();
            const firstDay    = new Date(currentYear, 0, 1);
            const lastDay     = new Date(currentYear, 11, 31);
            setStartDate(formatDate(firstDay));
            setEndDate(formatDate(lastDay));
        }
    }, [selectedUser]);

    // ページが初期化されたときに，渡された状態が存在しない場合はルートにリダイレクト
    useEffect(() => {
        if (!passedState) {
            navigate('/', { replace: true });
        }
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, [passedState, navigate]);

    // ソケットエラーが発生した場合，エラーページにリダイレクト
    useEffect(() => {
        if (socketError) {
            navigate('/error', {
                replace: true,
                state: { message: `リアルタイム接続エラー: ${socketError.message}` }
            });
        }
    }, [socketError, navigate]);

    // モーダル用のハンドラ関数を定義
    const handleUserClick = (user: FullUserInfo) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    return (
        <div className="home-page-container">
            <header className="home-header">
                <h1 className="board-title">在室状況一覧</h1>
                <p className="current-time">
                    {currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}&nbsp;
                    {currentTime.toLocaleTimeString('ja-JP')}
                </p>
                <Link to="/admin" state={{ allUsers: passedState?.allUsers }} className="admin-link-button">管理者メニュー</Link>
            </header>
            <main className="table-container">
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th className="name-col">名前</th>
                            {STATUS_COLUMNS.map(colName => (
                                <th key={colName} className="status-col">{colName}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.length > 0 ? (
                            sortedUsers.map((user) => {
                                const displayStatus = mapApiStatusToDisplayStatus(user.status);
                                return (
                                    <tr key={user.name} className={getGradeRowClass(user.grade)}>
                                        <td>
                                            <span className="user-name-clickable" onClick={() => handleUserClick(user)}>
                                                {user.name}
                                            </span>
                                        </td>
                                        {STATUS_COLUMNS.map(colName => (
                                            <td key={colName} className="status-cell">
                                                {displayStatus === colName && (
                                                    <span className={`status-marker ${getStatusColorClass(colName)}`}></span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="no-data-cell">表示するユーザーがいません．</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </main>

            <Modal isOpen={isModalOpen} onClose={closeModal}>
                {(isSnapshotLoading || snapshotError) ? (
                    <div className="modal-status-container">
                        {isSnapshotLoading && <p>グラフを読み込み中...</p>}
                        {snapshotError && <p className="error-message">グラフの取得に失敗しました: {snapshotError.message}</p>}
                    </div>
                ) : (
                    selectedUser && <ContributionGraph
                        userName={selectedUser.name}
                        year={new Date().getFullYear()}
                        dailyData={snapshotData?.[selectedUser.name] || {}}
                    />
                )}
            </Modal>
        </div>
    );
};

export default HomePage;