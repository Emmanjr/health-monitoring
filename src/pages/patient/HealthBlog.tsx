// src/pages/patient/HealthBlog.tsx
import React, { useState } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  CardMedia,
  Grid,
  Avatar,
  Divider,
  Chip,
  Button,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  IconButton
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SearchIcon from "@mui/icons-material/Search";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import PreviewIcon from "@mui/icons-material/Preview";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import UpdateIcon from "@mui/icons-material/Update";
import ShieldIcon from "@mui/icons-material/Shield";
import { useNavigate } from "react-router-dom";

// Define content categories and articles
interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  image: string;
  content: string;
  source: string;
  date: string;
  authorCredentials: string;
  tags: string[];
}

const ARTICLES: Article[] = [
  {
    id: "heart-health-101",
    title: "Understanding Heart Health: Prevention and Monitoring",
    summary: "Learn the essential facts about cardiovascular health approved by cardiologists.",
    category: "Heart Health",
    image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    content: `
      <h2>Heart Health: The Basics</h2>
      <p>According to the American Heart Association, cardiovascular disease remains the leading cause of death globally. Understanding the key factors that contribute to heart health is essential for prevention.</p>
      
      <h3>Key Risk Factors</h3>
      <ul>
        <li>High blood pressure (hypertension)</li>
        <li>High cholesterol and triglyceride levels</li>
        <li>Diabetes and prediabetes</li>
        <li>Smoking</li>
        <li>Obesity</li>
        <li>Physical inactivity</li>
        <li>Family history of heart disease</li>
      </ul>

      <h3>Monitoring Your Heart Health</h3>
      <p>Regular monitoring is essential for maintaining heart health. The American College of Cardiology recommends:</p>
      <ul>
        <li>Blood pressure check: At least once per year, more frequently if you have hypertension</li>
        <li>Cholesterol screening: Every 4-6 years for adults with normal levels</li>
        <li>Blood glucose test: Every 3 years if you're over 45 or have risk factors</li>
      </ul>

      <h3>Heart-Healthy Diet</h3>
      <p>The DASH (Dietary Approaches to Stop Hypertension) diet and Mediterranean diet are both clinically proven to support heart health. These diets emphasize:</p>
      <ul>
        <li>Fruits and vegetables</li>
        <li>Whole grains</li>
        <li>Lean proteins (fish, poultry)</li>
        <li>Legumes and nuts</li>
        <li>Limiting sodium, added sugars, and saturated fats</li>
      </ul>
    `,
    source: "American Heart Association",
    date: "April 15, 2025",
    authorCredentials: "Reviewed by Dr. Sarah Johnson, MD, Cardiologist",
    tags: ["heart health", "prevention", "monitoring", "diet"]
  },
  {
    id: "diabetes-management",
    title: "Managing Diabetes: Current Guidelines and Best Practices",
    summary: "Evidence-based approaches to diabetes management and prevention.",
    category: "Diabetes Care",
    image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    content: `
      <h2>Diabetes Management: Current Guidelines</h2>
      <p>The American Diabetes Association (ADA) regularly updates its Standards of Medical Care in Diabetes. These guidelines provide clinicians, patients, and others with the components of diabetes care, general treatment goals, and tools to evaluate the quality of care.</p>

      <h3>Key Management Strategies</h3>
      <ul>
        <li>Blood glucose monitoring: Regular monitoring is essential, with target ranges personalized for each individual</li>
        <li>Medication management: Following prescribed medication schedules as directed by healthcare providers</li>
        <li>Lifestyle modifications: Diet, exercise, and stress management</li>
        <li>Regular medical check-ups: Including eye exams, foot exams, and kidney function tests</li>
      </ul>

      <h3>Diet Recommendations</h3>
      <p>The ADA recommends individualized meal plans developed with a registered dietitian. General principles include:</p>
      <ul>
        <li>Focus on nutrient-dense foods</li>
        <li>Minimize added sugars and refined grains</li>
        <li>Choose whole foods over highly processed foods</li>
        <li>Monitor carbohydrate intake with consistent portions at meals</li>
      </ul>

      <h3>Physical Activity</h3>
      <p>Physical activity guidelines for adults with diabetes include:</p>
      <ul>
        <li>150 minutes or more of moderate-to-vigorous aerobic activity per week, spread over at least 3 days</li>
        <li>2–3 sessions per week of resistance exercise on non-consecutive days</li>
        <li>Flexibility and balance training 2–3 times per week for older adults</li>
        <li>Minimizing prolonged sitting with short bouts of activity every 30 minutes</li>
      </ul>
    `,
    source: "American Diabetes Association",
    date: "March 28, 2025",
    authorCredentials: "Reviewed by Dr. Michael Chen, MD, Endocrinologist",
    tags: ["diabetes", "management", "blood glucose", "medication"]
  },
  {
    id: "healthy-exercise-guide",
    title: "Exercise for Every Age: Safe and Effective Recommendations",
    summary: "Age-appropriate exercise guidelines backed by sports medicine research.",
    category: "Physical Activity",
    image: "https://plus.unsplash.com/premium_photo-1664303370975-5c535d2fdf90?q=80&w=1455&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: `
      <h2>Exercise Guidelines by Age Group</h2>
      <p>The World Health Organization and American College of Sports Medicine provide evidence-based physical activity recommendations tailored to different age groups.</p>

      <h3>Adults (18-64 years)</h3>
      <ul>
        <li>At least 150-300 minutes of moderate-intensity aerobic activity per week</li>
        <li>OR at least 75-150 minutes of vigorous-intensity aerobic physical activity per week</li>
        <li>Muscle-strengthening activities involving major muscle groups on 2 or more days per week</li>
        <li>Limit sedentary time and replace it with physical activity of any intensity</li>
      </ul>

      <h3>Older Adults (65+ years)</h3>
      <ul>
        <li>Same aerobic guidelines as adults</li>
        <li>Include multicomponent physical activity emphasizing functional balance and strength training 3+ days per week</li>
        <li>Tailor intensity and type of exercise to fitness level and health conditions</li>
      </ul>

      <h3>Safe Exercise Principles</h3>
      <p>For all age groups, safety is paramount:</p>
      <ul>
        <li>Start slowly and gradually increase intensity, duration, and frequency</li>
        <li>Warm up before and cool down after exercise</li>
        <li>Stay hydrated before, during, and after exercise</li>
        <li>Choose appropriate activities based on fitness level and health conditions</li>
        <li>Use proper form and technique to prevent injuries</li>
      </ul>

      <h3>Benefits of Regular Physical Activity</h3>
      <p>Research consistently demonstrates that regular exercise:</p>
      <ul>
        <li>Reduces risk of cardiovascular disease by 35%</li>
        <li>Reduces risk of type 2 diabetes by 40%</li>
        <li>Reduces risk of some cancers by 20-30%</li>
        <li>Improves mental health, cognitive function, and sleep quality</li>
        <li>Helps maintain healthy weight and muscle mass</li>
      </ul>
    `,
    source: "American College of Sports Medicine",
    date: "April 2, 2025",
    authorCredentials: "Reviewed by Dr. Amanda Rodriguez, DPT, Sports Medicine Specialist",
    tags: ["exercise", "physical activity", "fitness", "age-appropriate"]
  },
  {
    id: "stress-management",
    title: "Evidence-Based Stress Management Techniques",
    summary: "Scientifically validated approaches to managing stress and improving mental wellbeing.",
    category: "Mental Health",
    image: "https://images.unsplash.com/photo-1558451507-fa1a9432efb4?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    content: `
      <h2>The Science of Stress Management</h2>
      <p>According to the American Psychological Association, chronic stress contributes to numerous health problems including heart disease, diabetes, depression, and anxiety. Implementing effective stress management techniques is essential for overall wellness.</p>

      <h3>Mind-Body Techniques</h3>
      <p>Research-supported stress management approaches include:</p>
      <ul>
        <li>Mindfulness meditation: Shown to reduce stress hormone levels and inflammatory responses</li>
        <li>Deep breathing exercises: Can activate the parasympathetic nervous system, reducing stress response</li>
        <li>Progressive muscle relaxation: Systematically tensing and relaxing muscle groups to reduce physical tension</li>
        <li>Yoga: Combines physical postures, breathing exercises, and meditation, showing benefits for stress reduction</li>
      </ul>

      <h3>Cognitive Behavioral Approaches</h3>
      <p>Evidence-based cognitive techniques include:</p>
      <ul>
        <li>Cognitive restructuring: Identifying and challenging negative thought patterns</li>
        <li>Time management: Prioritizing tasks and setting boundaries</li>
        <li>Problem-solving skills: Developing systematic approaches to addressing stressors</li>
        <li>Social support: Maintaining connections with supportive individuals</li>
      </ul>

      <h3>Lifestyle Factors</h3>
      <p>Research consistently shows these factors impact stress management:</p>
      <ul>
        <li>Regular physical activity: 30 minutes of moderate activity daily reduces stress levels</li>
        <li>Adequate sleep: 7-9 hours of quality sleep helps regulate stress hormones</li>
        <li>Balanced nutrition: Limiting caffeine, alcohol, and highly processed foods</li>
        <li>Connection with others: Social support networks buffer against stress</li>
      </ul>
    `,
    source: "American Psychological Association",
    date: "March 15, 2025",
    authorCredentials: "Reviewed by Dr. James Wilson, Ph.D., Clinical Psychologist",
    tags: ["stress management", "mental health", "mindfulness", "anxiety reduction"]
  },
  {
    id: "nutrition-guidelines",
    title: "Current Nutrition Guidelines: Evidence-Based Recommendations",
    summary: "The latest nutritional science and dietary guidelines from leading health organizations.",
    category: "Nutrition",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    content: `
      <h2>Evidence-Based Nutrition Guidelines</h2>
      <p>The Dietary Guidelines for Americans, updated every five years, provides science-based advice on what to eat and drink to promote health, reduce risk of chronic disease, and meet nutrient needs.</p>

      <h3>Core Components of a Healthy Eating Pattern</h3>
      <ul>
        <li>Vegetables of all types – dark green, red and orange, beans, peas, and lentils, starchy, and other vegetables</li>
        <li>Fruits, especially whole fruit</li>
        <li>Grains, at least half of which are whole grain</li>
        <li>Dairy, including fat-free or low-fat milk, yogurt, and cheese</li>
        <li>Protein foods, including lean meats, poultry, eggs, seafood, beans, peas, and lentils, nuts and seeds</li>
        <li>Oils, including vegetable oils and oils in food, such as seafood and nuts</li>
      </ul>

      <h3>Nutrients to Limit</h3>
      <p>For optimal health, the following should be limited:</p>
      <ul>
        <li>Added sugars: Less than 10% of calories per day</li>
        <li>Saturated fat: Less than 10% of calories per day</li>
        <li>Sodium: Less than 2,300 milligrams per day (about 1 teaspoon of salt)</li>
        <li>Alcoholic beverages: Up to one drink per day for women and up to two drinks per day for men</li>
      </ul>

      <h3>Special Considerations</h3>
      <p>Nutritional needs vary based on:</p>
      <ul>
        <li>Life stage (pregnancy, breastfeeding, older adulthood)</li>
        <li>Chronic health conditions (diabetes, hypertension, celiac disease)</li>
        <li>Food allergies and intolerances</li>
        <li>Cultural and personal preferences</li>
      </ul>
    `,
    source: "U.S. Department of Agriculture and U.S. Department of Health and Human Services",
    date: "April 10, 2025",
    authorCredentials: "Reviewed by Dr. Lisa Thompson, Ph.D., RD, Nutritional Sciences",
    tags: ["nutrition", "diet", "healthy eating", "dietary guidelines"]
  }
];

// Main component
const HealthBlog = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Filter articles based on category and search term
  const filteredArticles = ARTICLES.filter(article => 
    (activeTab === "all" || article.category === activeTab) &&
    (article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
     article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const categories = ["all", ...Array.from(new Set(ARTICLES.map(a => a.category)))];
  
  // Toggle saved status of an article
  const toggleSaved = (articleId: string) => {
    if (savedArticles.includes(articleId)) {
      setSavedArticles(savedArticles.filter(id => id !== articleId));
    } else {
      setSavedArticles([...savedArticles, articleId]);
    }
  };
  
  // View article details
  const viewArticle = (article: Article) => {
    setSelectedArticle(article);
    window.scrollTo(0, 0);
  };

  // Back to article list
  const backToList = () => {
    setSelectedArticle(null);
  };
  
  // Book appointment related to health topic
  const bookAppointment = () => {
    navigate("/patient/appointments");
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Banner */}
      <Box sx={{ 
        position: 'relative',
        height: '200px',
        mb: 4,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1587854680352-936b22b91030?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(52, 152, 219, 0.5)'
          }}
        />
        <Box sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 3
        }}>
          <Box>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
              Health Resources
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              Evidence-based health information from trusted medical sources
            </Typography>
          </Box>
        </Box>
      </Box>

      {selectedArticle ? (
        // Article Detail View
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)' }}>
          <CardMedia
            component="img"
            height="240"
            image={selectedArticle.image}
            alt={selectedArticle.title}
          />
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Chip 
                  label={selectedArticle.category} 
                  color="primary" 
                  size="small" 
                  sx={{ mb: 2 }}
                />
                <Typography variant="h4" gutterBottom>
                  {selectedArticle.title}
                </Typography>
              </Box>
              <IconButton 
                onClick={() => toggleSaved(selectedArticle.id)}
                color="primary"
              >
                {savedArticles.includes(selectedArticle.id) 
                  ? <BookmarkIcon /> 
                  : <BookmarkBorderIcon />}
              </IconButton>
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedArticle.date} | Source: {selectedArticle.source}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {selectedArticle.authorCredentials}
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Article content - using dangerouslySetInnerHTML since content is predefined */}
            <Box sx={{ mb: 3 }}>
              <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {selectedArticle.tags.map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  size="small" 
                  variant="outlined" 
                />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                onClick={backToList}
                startIcon={<ArrowBackIcon />}
              >
                Back to Articles
              </Button>
              <Button 
                variant="contained" 
                onClick={bookAppointment}
                startIcon={<CalendarMonthIcon />}
              >
                Schedule Related Appointment
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        // Article List View
        <>
          {/* Search & Filter Section */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Search health articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: 'white', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => navigate('/patient/appointments')}
                    startIcon={<CalendarMonthIcon />}
                  >
                    Book Health Consultation
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          {/* Category Tabs */}
          <Box sx={{ mb: 4 }}>
            <Tabs 
              value={categories.findIndex(cat => cat === activeTab)} 
              onChange={(_, value) => setActiveTab(categories[value])}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#3498db',
                },
                '& .Mui-selected': {
                  color: '#3498db !important',
                },
              }}
            >
              {categories.map((category) => (
                <Tab 
                  key={category} 
                  label={category === "all" ? "All Articles" : category} 
                  sx={{ textTransform: 'none' }}
                />
              ))}
            </Tabs>
          </Box>
          
          {/* Articles Grid */}
          {filteredArticles.length > 0 ? (
            <Grid container spacing={3}>
              {filteredArticles.map((article) => (
                <Grid item xs={12} md={6} lg={4} key={article.id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                    position: 'relative'
                  }}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={article.image}
                      alt={article.title}
                    />
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      borderRadius: '50%',
                      p: 0.5
                    }}>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaved(article.id);
                        }}
                      >
                        {savedArticles.includes(article.id) 
                          ? <BookmarkIcon fontSize="small" color="primary" /> 
                          : <BookmarkBorderIcon fontSize="small" />}
                      </IconButton>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Chip 
                        label={article.category} 
                        size="small" 
                        sx={{ alignSelf: 'flex-start', mb: 1.5, fontSize: '0.7rem' }}
                        color="primary"
                      />
                      <Typography gutterBottom variant="h6" component="div" sx={{ mb: 1 }}>
                        {article.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {article.summary}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Typography variant="caption" color="text.secondary">
                          {article.date}
                        </Typography>
                        <Button 
                          endIcon={<PreviewIcon />}
                          onClick={() => viewArticle(article)}
                          size="small"
                        >
                          Read More
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ 
              py: 6, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: '#f9f9f9',
              borderRadius: 2
            }}>
              <ArticleIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No articles found matching your search
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Box>
          )}
          
          {/* Health Standards Section */}
          <Card sx={{ mt: 6, borderRadius: 3, bgcolor: '#f5f9fc' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutlineIcon sx={{ mr: 1 }} color="primary" />
                Our Health Information Standards
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Avatar sx={{ bgcolor: '#3498db', width: 56, height: 56, mb: 2 }}>
                      <LocalHospitalIcon />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>Evidence-Based</Typography>
                    <Typography variant="body2">
                      All health information is sourced from peer-reviewed medical journals and recognized health authorities.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Avatar sx={{ bgcolor: '#2ecc71', width: 56, height: 56, mb: 2 }}>
                      <UpdateIcon />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>Regularly Updated</Typography>
                    <Typography variant="body2">
                      Content is reviewed and updated by healthcare professionals to reflect current medical consensus.
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Avatar sx={{ bgcolor: '#9b59b6', width: 56, height: 56, mb: 2 }}>
                      <ShieldIcon />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>Medically Reviewed</Typography>
                    <Typography variant="body2">
                      All articles are reviewed by qualified healthcare practitioners before publication.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
};

export default HealthBlog;