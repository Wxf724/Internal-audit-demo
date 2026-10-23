import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { I18nextProvider } from 'react-i18next'

import { AppRoutes } from './router'
import i18n from './i18n'

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={__BASE_PATH__}>
        <Suspense fallback={<div />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </I18nextProvider>
  )
}

export default App
