const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

const dailyLocationsTabUI = `
                      {activeAdminSubTab === 'daily_locations' && (
                        <div className="space-y-6">
                          <div className="bg-stone-50 dark:bg-stone-900/50 rounded-2xl p-5 border border-stone-200 dark:border-stone-800">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-stone-100">일일 장소 설정</h4>
                                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                                  형광석과 참나무의 출현 장소를 날짜별로 지정할 수 있습니다. 설정된 장소는 익일 06:00부터 적용됩니다.
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                                const targetDate = new Date(weatherBaseDate);
                                targetDate.setDate(targetDate.getDate() + dayOffset);
                                const dateKey = format(targetDate, 'yyyy-MM-dd');
                                const displayDateStr = format(targetDate, 'MM.dd(EEE)');
                                const loc = localAdminDailyLocations[dateKey] || {};
                                
                                return (
                                  <div key={dateKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-xl shadow-sm">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-slate-800 dark:text-stone-200">
                                        {displayDateStr}
                                      </span>
                                      {dayOffset === 0 && <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold">오늘</span>}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                      <div className="flex-1 sm:flex-none">
                                        <label className="block text-[10px] font-bold text-stone-500 mb-1">형광석</label>
                                        <select
                                          value={loc.fluorescentRock || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setLocalAdminDailyLocations(prev => ({
                                              ...prev,
                                              [dateKey]: {
                                                ...prev[dateKey],
                                                fluorescentRock: val || undefined
                                              }
                                            }));
                                          }}
                                          className="w-full sm:w-32 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors"
                                        >
                                          <option value="">미지정</option>
                                          {Array.from({length: 12}).map((_, i) => (
                                            <option key={i+1} value={\`\${i+1}번홈\`}>{i+1}번홈</option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      <div className="flex-1 sm:flex-none">
                                        <label className="block text-[10px] font-bold text-stone-500 mb-1">참나무</label>
                                        <select
                                          value={loc.oakTree || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setLocalAdminDailyLocations(prev => ({
                                              ...prev,
                                              [dateKey]: {
                                                ...prev[dateKey],
                                                oakTree: val || undefined
                                              }
                                            }));
                                          }}
                                          className="w-full sm:w-32 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors"
                                        >
                                          <option value="">미지정</option>
                                          {Array.from({length: 12}).map((_, i) => (
                                            <option key={i+1} value={\`\${i+1}번홈\`}>{i+1}번홈</option>
                                          ))}
                                          <option value="참나무숲">참나무숲</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
`;

if (!code.includes("activeAdminSubTab === 'daily_locations'")) {
  code = code.replace(
    "{activeAdminSubTab === 'weather' && (",
    dailyLocationsTabUI + '\n' + "{activeAdminSubTab === 'weather' && ("
  );
  fs.writeFileSync('src/components/SettingsModal.tsx', code);
}
