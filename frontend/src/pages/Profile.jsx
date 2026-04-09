// import React, { useState } from 'react';
// import { useTheme } from '../context/ThemeContext.jsx';
// import { Card, Input, ScoreRing, Badge, ImgBanner } from '../components/UI.jsx';
// import { calcHealth, fmtK, IMGS } from '../utils.jsx';
// import { profileAPI } from '../api';

// export default function Profile({ profile, setProfile, onUpdate }) {
//   const { T } = useTheme();

//   /* -------------------------
//      PERSONAL INFO STATES
//   ------------------------- */
//   const [savingInfo, setSavingInfo] = useState(false);
//   const [infoLocked, setInfoLocked] = useState(false);

//   /* -------------------------
//      FINANCIAL SAVE STATES
//   ------------------------- */
//   const [saving, setSaving] = useState(false);
//   const [saved, setSaved] = useState(false);

//   /* -------------------------
//      CALCULATIONS
//   ------------------------- */
//   const score   = calcHealth(profile);
//   const surplus = Math.max(0, profile.income - profile.expenses - profile.emi);

//   /* -------------------------
//      UPDATE FUNCTION
//   ------------------------- */
//   const update = key => val =>
//     setProfile(prev => ({
//       ...prev,
//       [key]: typeof val === "string" && !isNaN(val) && val.trim() !== "" ? Number(val) : val
//     }));

//   /* -------------------------
//      SAVE PERSONAL INFO
//   ------------------------- */
//   const handlePersonalSave = async () => {
//     setSavingInfo(true);
//     try {
//       await profileAPI.update({
//         name: profile.name,
//         email: profile.email,
//         age: profile.age,
//         occupation: profile.occupation
//       });
//       await onUpdate(); // Refresh the whole profile from DB
//       setInfoLocked(true);
//     } catch (err) {
//       console.error('Failed to update personal info:', err);
//     } finally {
//       setSavingInfo(false);
//     }
//   };

//   const handleEditInfo = () => {
//     setInfoLocked(false);
//   };

//   /* -------------------------
//      SAVE FINANCIAL PROFILE
//   ------------------------- */
//   const saveProfile = async () => {
//     setSaving(true);
//     try {
//       await profileAPI.update({
//         income: profile.income,
//         expenses: profile.expenses,
//         emi: profile.emi,
//         savings: profile.savings,
//         investments: profile.investments,
//         emergency: profile.emergency
//       });
//       await onUpdate(); // Refresh parent
//       setSaved(true);
//       setTimeout(() => setSaved(false), 2000);
//     } catch (err) {
//       console.error('Failed to update financial profile:', err);
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* -------------------------
//      STYLES
//   ------------------------- */
//   const labelStyle = {
//     display: "block",
//     fontSize: 12,
//     color: T.textMuted,
//     marginBottom: 6,
//     fontWeight: 600
//   };

//   const inputStyle = {
//     width: "100%",
//     padding: "11px 14px",
//     borderRadius: 10,
//     border: `1.5px solid ${T.border}`,
//     background: T.inputBg,
//     color: T.text,
//     fontSize: 14,
//     outline: "none"
//   };

//   /* -------------------------
//      PRIORITIES
//   ------------------------- */
//   const priorities = [
//     { label: 'Emergency Fund',   need: profile.expenses * 6,       priority: 'High',   color: T.rose,  icon: '🛡️' },
//     { label: 'Health Insurance', need: profile.income * 0.04,      priority: 'High',   color: T.rose,  icon: '❤️' },
//     { label: 'EMI / Debt Repay', need: profile.emi,                priority: 'High',   color: T.amber, icon: '💳' },
//     { label: 'Mutual Funds/SIP', need: surplus * 0.5,              priority: 'Medium', color: T.amber, icon: '📊' },
//     { label: 'Home Loan',        need: surplus * 0.3,              priority: 'Medium', color: T.blue,  icon: '🏠' },
//     { label: 'Lifestyle Goals',  need: surplus * 0.2,              priority: 'Low',    color: T.teal,  icon: '✨' },
//   ];

//   return (
//     <div className="pf-page">

//       <ImgBanner
//         src={IMGS.profile}
//         title="Financial Profile"
//         subtitle="Build your Digital Financial Identity"
//         color={T.blue}
//       />

//       <div className="pf-grid">

//         {/* LEFT COLUMN */}
//         <div className="pf-left">

//           {/* PERSONAL INFORMATION */}
//           <Card style={{ marginBottom: 20 }}>
//             <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>
//               👤 Personal Information
//             </div>

//             <div style={{ display: 'grid', gap: 16 }}>
//               {[
//                 { label: "Full Name", key: "name", type: "text" },
//                 { label: "Email Address", key: "email", type: "email" },
//                 { label: "Age", key: "age", type: "number" },
//                 { label: "Occupation", key: "occupation", type: "text" }
//               ].map(field => (
//                 <div key={field.key}>
//                   <label style={labelStyle}>{field.label}</label>
//                   <input
//                     type={field.type}
//                     value={profile[field.key] || ""}
//                     disabled={infoLocked}
//                     onChange={e => update(field.key)(e.target.value)}
//                     style={{
//                       ...inputStyle,
//                       opacity: infoLocked ? 0.7 : 1,
//                       cursor: infoLocked ? "not-allowed" : "text"
//                     }}
//                   />
//                 </div>
//               ))}
//             </div>

//             <div style={{ marginTop: 20 }}>
//               {!infoLocked ? (
//                 <button
//                   onClick={handlePersonalSave}
//                   disabled={savingInfo}
//                   style={{
//                     width: "100%",
//                     padding: "12px 0",
//                     borderRadius: 12,
//                     border: "none",
//                     cursor: "pointer",
//                     fontWeight: 700,
//                     color: "#fff",
//                     background: `linear-gradient(135deg, ${T.teal}, ${T.blue})`
//                   }}
//                 >
//                   {savingInfo ? "Saving..." : "💾 Update Personal Info"}
//                 </button>
//               ) : (
//                 <button
//                   onClick={handleEditInfo}
//                   style={{
//                     width: "100%",
//                     padding: "12px 0",
//                     borderRadius: 12,
//                     border: `1px solid ${T.blue}`,
//                     background: "transparent",
//                     color: T.blue,
//                     fontWeight: 700,
//                     cursor: "pointer"
//                   }}
//                 >
//                   ✏️ Edit Information
//                 </button>
//               )}
//             </div>
//           </Card>

//           {/* SCORE CARD */}
//           <Card style={{ textAlign: 'center', padding: 28 }}>
//             <ScoreRing score={score} />
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
//               {[
//                 { l: 'Savings Rate',   v: profile.income ? `${Math.round(profile.savings / profile.income * 100)}%` : '0%', c: T.teal },
//                 { l: 'DTI Ratio',      v: profile.income ? `${Math.round(profile.emi / profile.income * 100)}%` : '0%', c: T.rose },
//                 { l: 'Monthly Surplus',v: fmtK(surplus), c: T.blue },
//                 { l: 'Invest Rate',    v: profile.income ? `${Math.round(profile.investments / profile.income * 100)}%` : '0%', c: T.violet },
//               ].map(({ l, v, c }) => (
//                 <div key={l} style={{ background: T.bg, borderRadius: 12, padding: 12, border: `1px solid ${T.border}` }}>
//                   <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontWeight: 600 }}>{l}</div>
//                   <div style={{ color: c, fontWeight: 800, fontSize: 18, fontFamily: "'JetBrains Mono',monospace" }}>{v}</div>
//                 </div>
//               ))}
//             </div>
//           </Card>

//         </div>


//         {/* RIGHT COLUMN */}
//         <div className="pf-right">

//           {/* FINANCIAL BREAKDOWN */}
//           <Card>
//             <div className="pf-form-title">🏦 Financial Breakdown</div>

//             <Input label="Monthly Income (₹)" value={profile.income} onChange={update('income')} />
//             <Input label="Monthly Expenses (₹)" value={profile.expenses} onChange={update('expenses')} />
//             <Input label="Monthly EMI / Loans (₹)" value={profile.emi} onChange={update('emi')} />
//             <Input label="Monthly Savings (₹)" value={profile.savings} onChange={update('savings')} />
//             <Input label="Monthly Investments (₹)" value={profile.investments} onChange={update('investments')} />
//             <Input label="Emergency Fund Total (₹)" value={profile.emergency} onChange={update('emergency')} />

//             <button
//               onClick={saveProfile}
//               disabled={saving}
//               style={{
//                 width: '100%',
//                 background: `linear-gradient(135deg,${T.teal},${T.blue})`,
//                 color: '#fff',
//                 border: 'none',
//                 borderRadius: 12,
//                 padding: '13px 0',
//                 fontWeight: 800,
//                 marginTop: 12,
//                 cursor: 'pointer'
//               }}
//             >
//               {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Profile'}
//             </button>
//           </Card>

//           {/* PRIORITY */}
//           <Card>
//             <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>
//               📋 Priority Hierarchy
//             </div>

//             {priorities.map(p => (
//               <div key={p.label}
//                 style={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                   padding: '10px 14px',
//                   background: T.bg,
//                   borderRadius: 10,
//                   border: `1px solid ${T.border}`,
//                   marginBottom: 8
//                 }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                   <span style={{ fontSize: 18 }}>{p.icon}</span>
//                   <div>
//                     <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
//                     <div style={{ fontSize: 11, color: T.textMuted }}>
//                       {fmtK(Math.round(p.need))}/mo
//                     </div>
//                   </div>
//                 </div>
//                 <Badge color={p.color}>{p.priority}</Badge>
//               </div>
//             ))}
//           </Card>

//         </div>

//       </div>
//     </div>
//   );
// }



import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { Card, Input, ScoreRing, Badge, ImgBanner } from '../components/UI.jsx';
import { calcHealth, fmtK, IMGS } from '../utils.jsx';
import { profileAPI } from '../api';

export default function Profile({ profile, setProfile, onUpdate }) {
  const { T } = useTheme();

  /* -------------------------
     PERSONAL INFO STATES
  ------------------------- */
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoLocked, setInfoLocked] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [warningMessages, setWarningMessages] = useState({});

  /* -------------------------
     FINANCIAL SAVE STATES
  ------------------------- */
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* -------------------------
     ASSETS STATES
  ------------------------- */
  const [assets, setAssets] = useState({
    physicalAssets: [],
    liquidAssets: [],
    liabilities: []
  });

  // Asset type options
  const physicalAssetOptions = [
    { id: 'realEstate', label: 'Real Estate', icon: '🏘️' },
    { id: 'gold', label: 'Gold/Jewelry', icon: '💍' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { id: 'otherPhysical', label: 'Other Physical Assets', icon: '📦' }
  ];

  const liquidAssetOptions = [
    { id: 'cash', label: 'Cash in Hand', icon: '💵' },
    { id: 'bankBalance', label: 'Bank Balance', icon: '🏦' },
    { id: 'mutualFunds', label: 'Mutual Funds', icon: '📈' },
    { id: 'stocks', label: 'Stocks', icon: '📊' },
    { id: 'otherLiquid', label: 'Other Liquid Assets', icon: '💎' }
  ];

  const liabilityOptions = [
    { id: 'homeLoan', label: 'Home Loan', icon: '🏠' },
    { id: 'carLoan', label: 'Car Loan', icon: '🚙' },
    { id: 'personalLoan', label: 'Personal Loan', icon: '💳' },
    { id: 'otherLiabilities', label: 'Other Liabilities', icon: '⚠️' }
  ];

  // New asset entry states
  const [selectedAssetType, setSelectedAssetType] = useState('physical');
  const [selectedAssetOption, setSelectedAssetOption] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [showAssetModal, setShowAssetModal] = useState(false);

  /* -------------------------
     FINANCIAL FIELDS WITH SIMILAR STYLE
  ------------------------- */
  const [financialFields, setFinancialFields] = useState({
    income: { value: profile.income || 0, required: true },
    expenses: { value: profile.expenses || 0, required: true },
    emi: { value: profile.emi || 0, required: true },
    investments: { value: profile.investments || 0, required: false },
    emergency: { value: profile.emergency || 0, required: false }
  });

  /* -------------------------
     LOAD ASSETS ON MOUNT
  ------------------------- */
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const response = await profileAPI.getAssets();
      if (response.assets) {
        const backendAssets = response.assets;
        
        // Convert object structure from backend to array structure for frontend
        const convert = (obj, options) => {
          return Object.entries(obj || {}).map(([id, value]) => {
            const opt = options.find(o => o.id === id);
            return {
              id,
              label: opt?.label || id,
              icon: opt?.icon || '📌',
              value: value || 0
            };
          }).filter(a => a.value > 0);
        };

        setAssets({
          physicalAssets: convert(backendAssets.physicalAssets, physicalAssetOptions),
          liquidAssets: convert(backendAssets.liquidAssets, liquidAssetOptions),
          liabilities: convert(backendAssets.liabilities, liabilityOptions)
        });
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  };

  /* -------------------------
     CALCULATIONS
  ------------------------- */
  const score = calcHealth(profile);
  const surplus = Math.max(0, profile.income - profile.expenses - profile.emi);
  
  // Calculate dynamic savings (remaining amount after all expenses)
  const calculatedSavings = Math.max(0, profile.income - (profile.expenses || 0) - (profile.emi || 0) - (profile.investments || 0) - (profile.emergency || 0));
  
  // Auto-update savings when other fields change
  useEffect(() => {
    if (profile.income > 0) {
      const newSavings = calculatedSavings;
      setProfile(prev => ({
        ...prev,
        savings: newSavings
      }));
    }
  }, [profile.income, profile.expenses, profile.emi]);

  // Sync financial fields with profile
  useEffect(() => {
    setFinancialFields({
      income: { value: profile.income || 0, required: true },
      expenses: { value: profile.expenses || 0, required: true },
      emi: { value: profile.emi || 0, required: true },
      investments: { value: profile.investments || 0, required: false },
      emergency: { value: profile.emergency || 0, required: false }
    });
  }, [profile.income, profile.expenses, profile.emi, profile.investments, profile.emergency]);

  /* -------------------------
     EXPENDITURE INDICATORS
  ------------------------- */
  const getExpenditureLevel = () => {
    const expenseRatio = profile.income > 0 ? (profile.expenses / profile.income) * 100 : 0;
    if (expenseRatio <= 30) return { level: 'Low', color: '🟢', textColor: T.green || '#10b981' };
    if (expenseRatio <= 60) return { level: 'Medium', color: '🟡', textColor: T.amber || '#f59e0b' };
    return { level: 'High', color: '🔴', textColor: T.rose || '#ef4444' };
  };

  const getEMILevel = () => {
    const emiRatio = profile.income > 0 ? (profile.emi / profile.income) * 100 : 0;
    if (emiRatio <= 20) return { level: 'Low', color: '🟢', textColor: T.green || '#10b981' };
    if (emiRatio <= 40) return { level: 'Medium', color: '🟡', textColor: T.amber || '#f59e0b' };
    return { level: 'High', color: '🔴', textColor: T.rose || '#ef4444' };
  };

  const getInvestmentLevel = () => {
    const investmentRatio = profile.income > 0 ? (profile.investments / profile.income) * 100 : 0;
    if (investmentRatio >= 20) return { level: 'Good', color: '🟢', textColor: T.green || '#10b981' };
    if (investmentRatio >= 10) return { level: 'Average', color: '🟡', textColor: T.amber || '#f59e0b' };
    return { level: 'Poor', color: '🔴', textColor: T.rose || '#ef4444' };
  };

  const expenditureLevel = getExpenditureLevel();
  const emiLevel = getEMILevel();
  const investmentLevel = getInvestmentLevel();

  /* -------------------------
     VALIDATION FUNCTIONS
  ------------------------- */
  const validateFinancialField = (field, value) => {
    const numValue = Number(value) || 0;
    let error = '';
    let warning = '';

    if (field === 'expenses') {
      const totalExpenses = numValue + (profile.emi || 0);
      if (totalExpenses > profile.income && profile.income > 0) {
        error = `Expenses + EMI (₹${fmtK(totalExpenses)}) exceed monthly income (₹${fmtK(profile.income)})`;
        warning = `⚠️ Total expenses exceed income by ₹${fmtK(totalExpenses - profile.income)}`;
      }
    } else if (field === 'emi') {
      const totalExpenses = (profile.expenses || 0) + numValue;
      if (totalExpenses > profile.income && profile.income > 0) {
        error = `EMI + Expenses (₹${fmtK(totalExpenses)}) exceed monthly income (₹${fmtK(profile.income)})`;
        warning = `⚠️ Total EMI exceeds income by ₹${fmtK(totalExpenses - profile.income)}`;
      }
    } else if (field === 'investments') {
      const totalAfterExpenses = profile.income - (profile.expenses || 0) - (profile.emi || 0);
      if (numValue > totalAfterExpenses && totalAfterExpenses > 0) {
        warning = `⚠️ Investments (₹${fmtK(numValue)}) exceed available surplus (₹${fmtK(totalAfterExpenses)})`;
      }
    }

    setValidationErrors(prev => ({ ...prev, [field]: error }));
    setWarningMessages(prev => ({ ...prev, [field]: warning }));
    return !error;
  };

  /* -------------------------
     UPDATE FUNCTION WITH VALIDATION
  ------------------------- */
  const update = key => val => {
    const processedVal = typeof val === "string" && !isNaN(val) && val.trim() !== "" ? Number(val) : 
                         (val === "" ? 0 : val);
    
    if (key === 'expenses' || key === 'emi' || key === 'investments') {
      validateFinancialField(key, processedVal);
    }
    
    setProfile(prev => ({
      ...prev,
      [key]: processedVal
    }));
  };

  /* -------------------------
     ASSETS UPDATE FUNCTION
  ------------------------- */
  const addAsset = () => {
    if (!selectedAssetOption || !assetValue) return;
    
    const numValue = Number(assetValue) || 0;
    const assetOption = selectedAssetOption;
    
    let assetCategory;
    let assetList;
    
    if (selectedAssetType === 'physical') {
      assetCategory = 'physicalAssets';
      assetList = [...assets.physicalAssets];
    } else if (selectedAssetType === 'liquid') {
      assetCategory = 'liquidAssets';
      assetList = [...assets.liquidAssets];
    } else {
      assetCategory = 'liabilities';
      assetList = [...assets.liabilities];
    }
    
    // Check if asset already exists
    const existingIndex = assetList.findIndex(a => a.id === assetOption);
    if (existingIndex >= 0) {
      assetList[existingIndex].value = numValue;
    } else {
      const option = [...physicalAssetOptions, ...liquidAssetOptions, ...liabilityOptions].find(opt => opt.id === assetOption);
      assetList.push({
        id: assetOption,
        label: option?.label || assetOption,
        icon: option?.icon || '📌',
        value: numValue
      });
    }
    
    setAssets(prev => ({
      ...prev,
      [assetCategory]: assetList
    }));
    
    // Reset form
    setSelectedAssetOption('');
    setAssetValue('');
    setShowAssetModal(false);
  };

  const removeAsset = (category, assetId) => {
    setAssets(prev => ({
      ...prev,
      [category]: prev[category].filter(asset => asset.id !== assetId)
    }));
  };

  const updateAssetValue = (category, assetId, newValue) => {
    const numValue = Number(newValue) || 0;
    setAssets(prev => ({
      ...prev,
      [category]: prev[category].map(asset => 
        asset.id === assetId ? { ...asset, value: numValue } : asset
      )
    }));
  };

  /* -------------------------
     CALCULATE TOTAL ASSETS
  ------------------------- */
  const calculateTotalAssets = () => {
    const totalPhysical = assets.physicalAssets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiquid = assets.liquidAssets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = assets.liabilities.reduce((sum, asset) => sum + asset.value, 0);
    const netWorth = (totalPhysical + totalLiquid) - totalLiabilities;
    
    return { totalPhysical, totalLiquid, totalLiabilities, netWorth };
  };

  /* -------------------------
     DYNAMIC PRIORITIES BASED ON USER DATA
  ------------------------- */
  const generateDynamicPriorities = () => {
    const emergencyNeed = (profile.expenses || 0) * 6;
    const healthNeed = (profile.income || 0) * 0.04;
    const surplusAmount = Math.max(0, (profile.income || 0) - (profile.expenses || 0) - (profile.emi || 0));
    
    const basePriorities = [
      { 
        id: 'emergency', 
        label: 'Emergency Fund', 
        need: emergencyNeed, 
        current: profile.emergency || 0,
        priority: 'High', 
        color: T.rose || '#ef4444', 
        icon: '🛡️',
        progress: emergencyNeed > 0 ? Math.min(100, ((profile.emergency || 0) / emergencyNeed) * 100) : 0
      },
      { 
        id: 'health', 
        label: 'Health Insurance', 
        need: healthNeed, 
        current: 0,
        priority: 'High', 
        color: T.rose || '#ef4444', 
        icon: '❤️',
        progress: 0
      },
      { 
        id: 'emi', 
        label: 'EMI / Debt Repay', 
        need: profile.emi || 0, 
        current: (profile.emi || 0),
        priority: 'High', 
        color: T.amber || '#f59e0b', 
        icon: '💳',
        progress: (profile.emi || 0) > 0 ? 100 : 0
      },
      { 
        id: 'mutual', 
        label: 'Mutual Funds/SIP', 
        need: surplusAmount * 0.5, 
        current: profile.investments || 0,
        priority: 'Medium', 
        color: T.amber || '#f59e0b', 
        icon: '📊',
        progress: surplusAmount > 0 ? Math.min(100, ((profile.investments || 0) / (surplusAmount * 0.5)) * 100) : 0
      },
      { 
        id: 'home', 
        label: 'Home Loan Prepayment', 
        need: surplusAmount * 0.3, 
        current: 0,
        priority: 'Medium', 
        color: T.blue || '#3b82f6', 
        icon: '🏠',
        progress: 0
      },
      { 
        id: 'lifestyle', 
        label: 'Lifestyle Goals', 
        need: surplusAmount * 0.2, 
        current: 0,
        priority: 'Low', 
        color: T.teal || '#14b8a6', 
        icon: '✨',
        progress: 0
      },
    ];
    
    return basePriorities;
  };

  const [priorities, setPriorities] = useState([]);
  const [editingPriority, setEditingPriority] = useState(null);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  // Update priorities when profile data changes
  useEffect(() => {
    if (priorities.length === 0 || profile.income > 0) {
      setPriorities(generateDynamicPriorities());
    }
  }, [profile.income, profile.expenses, profile.emi, profile.emergency, profile.investments]);

  // Sort priorities based on priority level (High to Low)
  const sortedPriorities = [...priorities].sort((a, b) => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  /* -------------------------
     UPDATE PRIORITY
  ------------------------- */
  const updatePriorityLevel = (id, newPriority) => {
    setPriorities(prev => prev.map(p => 
      p.id === id ? { ...p, priority: newPriority } : p
    ));
    setEditingPriority(null);
    setShowPriorityModal(false);
  };

  /* -------------------------
     SAVE PERSONAL INFO
  ------------------------- */
  const handlePersonalSave = async () => {
    setSavingInfo(true);
    try {
      await profileAPI.update({
        name: profile.name,
        email: profile.email,
        age: profile.age,
        occupation: profile.occupation
      });
      await onUpdate();
      setInfoLocked(true);
    } catch (err) {
      console.error('Failed to update personal info:', err);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleEditInfo = () => {
    setInfoLocked(false);
  };

  /* -------------------------
     SAVE FINANCIAL PROFILE
  ------------------------- */
  const saveProfile = async () => {
    // Check for validation errors before saving
    const hasErrors = Object.values(validationErrors).some(error => error !== '');
    if (hasErrors) {
      alert('Please fix validation errors before saving');
      return;
    }
    
    setSaving(true);
    try {
      await profileAPI.update({
        income: profile.income,
        expenses: profile.expenses,
        emi: profile.emi,
        savings: profile.savings,
        investments: profile.investments,
        emergency: profile.emergency
      });
      
      // Convert array structure from frontend to object structure for backend
      const convertToObj = (arr) => {
        const obj = {};
        arr.forEach(a => { obj[a.id] = a.value; });
        return obj;
      };

      const assetsToSave = {
        physicalAssets: convertToObj(assets.physicalAssets),
        liquidAssets: convertToObj(assets.liquidAssets),
        liabilities: convertToObj(assets.liabilities)
      };

      // Save assets to backend
      await profileAPI.updateAssets(assetsToSave);
      
      await onUpdate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update financial profile:', err);
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------
     STYLES
  ------------------------- */
  const labelStyle = {
    display: "block",
    fontSize: 12,
    color: T.textMuted,
    marginBottom: 6,
    fontWeight: 600
  };

  const inputStyle = (hasError = false, hasWarning = false) => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${hasError ? (T.rose || '#ef4444') : hasWarning ? (T.amber || '#f59e0b') : (T.border || '#e5e7eb')}`,
    background: hasError ? `${T.rose || '#ef4444'}10` : hasWarning ? `${T.amber || '#f59e0b'}10` : (T.inputBg || '#ffffff'),
    color: T.text || '#1f2937',
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s ease"
  });

  const totalAssets = calculateTotalAssets();

  return (
    <div className="pf-page">

      <ImgBanner
        src={IMGS.profile}
        title="Financial Profile"
        subtitle="Build your Digital Financial Identity"
        color={T.blue}
      />

      <div className="pf-grid">

        {/* LEFT COLUMN */}
        <div className="pf-left">

          {/* PERSONAL INFORMATION */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>
              👤 Personal Information
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { label: "Full Name", key: "name", type: "text", required: true },
                { label: "Email Address", key: "email", type: "email", required: true },
                { label: "Age", key: "age", type: "number", required: true },
                { label: "Occupation", key: "occupation", type: "text", required: true }
              ].map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>
                    {field.label} {field.required && <span style={{ color: T.rose || '#ef4444' }}>*</span>}
                  </label>
                  <input
                    type={field.type === 'number' ? 'text' : field.type}
                    inputMode={field.type === 'number' ? 'numeric' : undefined}
                    value={profile[field.key] || ""}
                    disabled={infoLocked}
                    onChange={e => update(field.key)(e.target.value)}
                    style={inputStyle(false, false)}
                    required={field.required}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              {!infoLocked ? (
                <button
                  onClick={handlePersonalSave}
                  disabled={savingInfo}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#fff",
                    background: `linear-gradient(135deg, ${T.teal || '#14b8a6'}, ${T.blue || '#3b82f6'})`
                  }}
                >
                  {savingInfo ? "Saving..." : "💾 Update Personal Info"}
                </button>
              ) : (
                <button
                  onClick={handleEditInfo}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 12,
                    border: `1px solid ${T.blue || '#3b82f6'}`,
                    background: "transparent",
                    color: T.blue || '#3b82f6',
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ✏️ Edit Information
                </button>
              )}
            </div>
          </Card>

          {/* SCORE CARD */}
          <Card style={{ textAlign: 'center', padding: 28 }}>
            <ScoreRing score={score} />
            
            {/* Expenditure Indicators */}
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.textMuted }}>
                Financial Health Indicators
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ textAlign: 'center', padding: 8, background: T.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>{expenditureLevel.color}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: expenditureLevel.textColor }}>Expenses</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>
                    {profile.income > 0 ? Math.round((profile.expenses / profile.income) * 100) : 0}%
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: T.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>{emiLevel.color}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: emiLevel.textColor }}>EMI/Debt</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>
                    {profile.income > 0 ? Math.round((profile.emi / profile.income) * 100) : 0}%
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: 8, background: T.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>{investmentLevel.color}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: investmentLevel.textColor }}>Investments</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>
                    {profile.income > 0 ? Math.round((profile.investments / profile.income) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              {[
                { l: 'Savings Rate', v: profile.income ? `${Math.round(calculatedSavings / profile.income * 100)}%` : '0%', c: T.teal || '#14b8a6' },
                { l: 'DTI Ratio', v: profile.income ? `${Math.round(profile.emi / profile.income * 100)}%` : '0%', c: T.rose || '#ef4444' },
                { l: 'Monthly Surplus', v: fmtK(surplus), c: T.blue || '#3b82f6' },
                { l: 'Invest Rate', v: profile.income ? `${Math.round(profile.investments / profile.income * 100)}%` : '0%', c: T.violet || '#8b5cf6' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ background: T.bg, borderRadius: 12, padding: 12, border: `1px solid ${T.border || '#e5e7eb'}` }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontWeight: 600 }}>{l}</div>
                  <div style={{ color: c, fontWeight: 800, fontSize: 18, fontFamily: "'JetBrains Mono',monospace" }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* ASSET CLASSIFICATION CARD */}
          <Card style={{ marginTop: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>
              🏦 Asset Classification
            </div>
            
            {/* Add Asset Button */}
            <button
              onClick={() => setShowAssetModal(true)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: `2px dashed ${T.blue || '#3b82f6'}`,
                background: "transparent",
                color: T.blue || '#3b82f6',
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              ➕ Add New Asset/Liability
            </button>

            {/* Physical Assets */}
            {assets.physicalAssets.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: T.blue || '#3b82f6' }}>
                  🏠 Physical Assets
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {assets.physicalAssets.map(asset => (
                    <div key={asset.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          label={`${asset.icon} ${asset.label} (₹)`}
                          value={asset.value}
                          onChange={(val) => updateAssetValue('physicalAssets', asset.id, val)}
                        />
                      </div>
                      <button
                        onClick={() => removeAsset('physicalAssets', asset.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: `1px solid ${T.rose || '#ef4444'}`,
                          background: "transparent",
                          color: T.rose || '#ef4444',
                          cursor: "pointer",
                          marginTop: 20
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liquid Assets */}
            {assets.liquidAssets.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: T.teal || '#14b8a6' }}>
                  💧 Liquid Assets
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {assets.liquidAssets.map(asset => (
                    <div key={asset.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          label={`${asset.icon} ${asset.label} (₹)`}
                          value={asset.value}
                          onChange={(val) => updateAssetValue('liquidAssets', asset.id, val)}
                        />
                      </div>
                      <button
                        onClick={() => removeAsset('liquidAssets', asset.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: `1px solid ${T.rose || '#ef4444'}`,
                          background: "transparent",
                          color: T.rose || '#ef4444',
                          cursor: "pointer",
                          marginTop: 20
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liabilities */}
            {assets.liabilities.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: T.rose || '#ef4444' }}>
                  📉 Liabilities
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {assets.liabilities.map(asset => (
                    <div key={asset.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          label={`${asset.icon} ${asset.label} (₹)`}
                          value={asset.value}
                          onChange={(val) => updateAssetValue('liabilities', asset.id, val)}
                        />
                      </div>
                      <button
                        onClick={() => removeAsset('liabilities', asset.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: `1px solid ${T.rose || '#ef4444'}`,
                          background: "transparent",
                          color: T.rose || '#ef4444',
                          cursor: "pointer",
                          marginTop: 20
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Asset Summary */}
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              background: T.bg, 
              borderRadius: 12,
              border: `1px solid ${T.border || '#e5e7eb'}`
            }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Asset Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Total Physical</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.blue || '#3b82f6' }}>{fmtK(totalAssets.totalPhysical)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Total Liquid</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.teal || '#14b8a6' }}>{fmtK(totalAssets.totalLiquid)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Total Liabilities</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.rose || '#ef4444' }}>{fmtK(totalAssets.totalLiabilities)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Net Worth</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: totalAssets.netWorth >= 0 ? (T.green || '#10b981') : (T.rose || '#ef4444') }}>
                    {fmtK(totalAssets.netWorth)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="pf-right">

          {/* FINANCIAL BREAKDOWN - Updated with similar style */}
          <Card>
            <div className="pf-form-title">🏦 Financial Breakdown</div>

            {Object.entries(financialFields).map(([key, field]) => (
              <div key={key}>
                <label style={labelStyle}>
                  {key === 'income' ? 'Monthly Income' : 
                   key === 'expenses' ? 'Monthly Expenses' :
                   key === 'emi' ? 'Monthly EMI' :
                   key === 'investments' ? 'Monthly Investments' :
                   'Emergency Fund Total'} (₹)
                  {field.required && <span style={{ color: T.rose || '#ef4444' }}>*</span>}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={field.value}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    update(key)(val);
                  }}
                  style={inputStyle(validationErrors[key], warningMessages[key])}
                  required={field.required}
                />
                {validationErrors[key] && (
                  <div style={{ color: T.rose || '#ef4444', fontSize: 11, marginTop: 4 }}>{validationErrors[key]}</div>
                )}
                {warningMessages[key] && !validationErrors[key] && (
                  <div style={{ color: T.amber || '#f59e0b', fontSize: 11, marginTop: 4 }}>{warningMessages[key]}</div>
                )}
              </div>
            ))}

            <div>
              <label style={labelStyle}>
                Monthly Savings (₹) <span style={{ color: T.green || '#10b981' }}>(Auto-calculated)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={calculatedSavings}
                style={inputStyle(false, false)}
                disabled
              />
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                💡 Savings = Income - Expenses - EMI
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                width: '100%',
                background: `linear-gradient(135deg,${T.teal || '#14b8a6'},${T.blue || '#3b82f6'})`,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '13px 0',
                fontWeight: 800,
                marginTop: 12,
                cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Profile'}
            </button>
          </Card>

          {/* PRIORITY HIERARCHY CARD - Sorted by priority */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                📋 Priority Hierarchy
              </div>
              <button
                onClick={() => setPriorities(generateDynamicPriorities())}
                style={{
                  padding: '4px 12px',
                  fontSize: 11,
                  borderRadius: 20,
                  border: `1px solid ${T.blue || '#3b82f6'}`,
                  background: 'transparent',
                  color: T.blue || '#3b82f6',
                  cursor: 'pointer'
                }}
              >
                🔄 Reset Priorities
              </button>
            </div>

            {sortedPriorities.map(p => (
              <div key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: T.bg,
                  borderRadius: 10,
                  border: `1px solid ${T.border || '#e5e7eb'}`,
                  marginBottom: 8
                }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        Target: {fmtK(Math.round(p.need))}/mo | Current: {fmtK(Math.round(p.current))}/mo
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ 
                    height: 4, 
                    background: `${p.color}30`, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    marginTop: 4
                  }}>
                    <div style={{ 
                      width: `${p.progress}%`, 
                      height: '100%', 
                      background: p.color,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge color={p.color}>{p.priority}</Badge>
                  <button
                    onClick={() => {
                      setEditingPriority(p);
                      setShowPriorityModal(true);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      borderRadius: 6,
                      border: `1px solid ${T.border || '#e5e7eb'}`,
                      background: 'transparent',
                      color: T.text || '#1f2937',
                      cursor: 'pointer'
                    }}
                  >
                    ⚙️ Set
                  </button>
                </div>
              </div>
            ))}

            {/* Priority Modal */}
            {showPriorityModal && editingPriority && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: T.cardBg || '#ffffff',
                  borderRadius: 16,
                  padding: 24,
                  width: 300,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}>
                  <h3 style={{ marginBottom: 16 }}>Set Priority for {editingPriority.label}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {['High', 'Medium', 'Low'].map(level => (
                      <button
                        key={level}
                        onClick={() => updatePriorityLevel(editingPriority.id, level)}
                        style={{
                          padding: '10px',
                          borderRadius: 8,
                          border: `1px solid ${T.border || '#e5e7eb'}`,
                          background: editingPriority.priority === level ? (T.blue || '#3b82f6') : 'transparent',
                          color: editingPriority.priority === level ? '#fff' : (T.text || '#1f2937'),
                          cursor: 'pointer'
                        }}
                      >
                        {level} Priority
                      </button>
                    ))}
                    <button
                      onClick={() => setShowPriorityModal(false)}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: 'none',
                        background: T.rose || '#ef4444',
                        color: '#fff',
                        cursor: 'pointer',
                        marginTop: 8
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Asset Modal */}
      {showAssetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: T.cardBg || '#ffffff',
            borderRadius: 16,
            padding: 24,
            width: 400,
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginBottom: 16 }}>Add New Asset/Liability</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Asset Type</label>
              <select
                value={selectedAssetType}
                onChange={(e) => {
                  setSelectedAssetType(e.target.value);
                  setSelectedAssetOption('');
                }}
                style={inputStyle(false, false)}
              >
                <option value="physical">Physical Assets</option>
                <option value="liquid">Liquid Assets</option>
                <option value="liability">Liabilities</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Select Asset</label>
              <select
                value={selectedAssetOption}
                onChange={(e) => setSelectedAssetOption(e.target.value)}
                style={inputStyle(false, false)}
              >
                <option value="">Select an option</option>
                {selectedAssetType === 'physical' && physicalAssetOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
                ))}
                {selectedAssetType === 'liquid' && liquidAssetOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
                ))}
                {selectedAssetType === 'liability' && liabilityOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Value (₹)</label>
              <input
                type="text"
                inputMode="numeric"
                value={assetValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAssetValue(val);
                }}
                placeholder="Enter amount"
                style={inputStyle(false, false)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={addAsset}
                disabled={!selectedAssetOption || !assetValue}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  background: `linear-gradient(135deg, ${T.teal || '#14b8a6'}, ${T.blue || '#3b82f6'})`,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: selectedAssetOption && assetValue ? 'pointer' : 'not-allowed',
                  opacity: selectedAssetOption && assetValue ? 1 : 0.5
                }}
              >
                Add Asset
              </button>
              <button
                onClick={() => setShowAssetModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  border: `1px solid ${T.border || '#e5e7eb'}`,
                  background: 'transparent',
                  color: T.text || '#1f2937',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}