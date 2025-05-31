// // components/HeaderSelector.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { getAuth } from 'firebase/auth'
// import { getFirestore, doc, getDoc } from 'firebase/firestore'
// import {AdminHeader} from '@/components/AdminHeader'
// import {StaffHeader} from '@/components/StaffHeader'
// import DefaultHeader from '@/components/DefaultHeader'
// import { auth, db } from '@/lib/firebase' // your firebase config

// interface Props {
//   role: string | null;
// }

// // const HeaderSelector: React.FC<Props> = ({ role }) => {
// //   if (role === "admin") return <AdminHeader />;
// //   if (role === "staff") return <StaffHeader />;
// //   return <DefaultHeader />;
// // };

// export default HeaderSelector;
