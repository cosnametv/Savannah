import React, { createContext, useContext, useMemo, useState } from 'react'

const AppThemeContext = createContext({
	theme: 'light',
	toggleTheme: (_next) => {}
})

export function AppThemeProvider({ children }) {
	const [theme, setTheme] = useState('light')

	const toggleTheme = (next) => {
		if (next === 'light' || next === 'dark') {
			setTheme(next)
			return
		}
		setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
	}

	const value = useMemo(() => ({ theme, toggleTheme }), [theme])

	return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
}

export function useAppTheme() {
	return useContext(AppThemeContext)
}
