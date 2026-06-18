import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HelloNavbar from '../components/hello/HelloNavbar'
import Hero from '../components/hello/Hero'
import FeatureSection from '../components/hello/FeatureSection'
import ReportPreviewSection from '../components/hello/ReportPreviewSection'
import CTASection from '../components/hello/CTASection'
import HelloFooter from '../components/hello/HelloFooter'

export default function HelloPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/select', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] overflow-x-hidden">
      <HelloNavbar />
      <Hero />
      <FeatureSection />
      <ReportPreviewSection />
      <CTASection />
      <HelloFooter />
    </div>
  )
}
