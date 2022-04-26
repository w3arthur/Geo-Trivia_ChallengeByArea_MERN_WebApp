import React from "react";
import LanguageFlags from "./multilanguage/LanguageFlags";
import { useTranslation } from "../Hooks"
import '../Styles/logo.css';

import { Outlet } from "react-router-dom";

export default function Logo () {

 const { t } = useTranslation();

 return(<>
  <div className="logo">
      <LanguageFlags />
 </div>

<Outlet/>
 
 </>);}