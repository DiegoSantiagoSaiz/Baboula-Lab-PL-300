import type { Question } from '../types';

export const OFFLINE_FLASHCARDS: Question[] = [
    {
        type: 'MultipleChoice',
        category: 'Prepare the data',
        difficulty: 'Medium',
        question: 'How should you handle mismatched granularity in Power BI when combining a daily sales table with a monthly budget table?',
        options: [
            'Create a direct relationship between Date and Month columns',
            'Allocate monthly budgets to daily values, or roll daily sales up to monthly budgets using a custom date or bridge table',
            'Merge the tables using a Left Outer join in Power Query without transforming them',
            'Use a calculated column in the Budget table with TODAY()'
        ],
        answer: 'Allocate monthly budgets to daily values, or roll daily sales up to monthly budgets using a custom date or bridge table',
        explanation: 'Mismatched granularity (daily vs. monthly) prevents direct relationships. You must either allocate monthly budgets down to a daily level (e.g. dividing by days in the month) or aggregate daily sales up to the monthly level in DAX or Power Query to ensure comparable visual analysis.'
    },
    {
        type: 'MultipleChoice',
        category: 'Model the data',
        difficulty: 'Hard',
        question: 'Which DAX function should you use to override the default filter context and calculate Sales for only the "Europe" region, regardless of active visual filters?',
        options: [
            'FILTER(Sales, Sales[Region] = "Europe")',
            'ALL(Sales[Region])',
            'CALCULATE(Sales[TotalSales], Geography[Region] = "Europe") combined with ALL or REMOVEFILTERS',
            'RELATEDTABLE(Geography)'
        ],
        answer: 'CALCULATE(Sales[TotalSales], Geography[Region] = "Europe") combined with ALL or REMOVEFILTERS',
        explanation: 'CALCULATE modifies the filter context. To ignore existing regional filters on the visual, use ALL(Geography[Region]) or REMOVEFILTERS(Geography[Region]) inside CALCULATE.'
    },
    {
        type: 'MultipleChoice',
        category: 'Visualize and analyze the data',
        difficulty: 'Medium',
        question: 'You need to identify key factors influencing a high customer churn rate in a dashboard. Which visual is specifically designed to perform automated machine learning driver analysis?',
        options: [
            'Decomposition Tree',
            'Key Influencers Visual',
            'Q&A Visual',
            'Smart Narrative'
        ],
        answer: 'Key Influencers Visual',
        explanation: 'The Key Influencers visual helps you understand the factors that drive a metric of interest. It analyzes your data, ranks the factors that matter, and displays them as key influencers.'
    },
    {
        type: 'MultipleChoice',
        category: 'Deploy and maintain assets',
        difficulty: 'Easy',
        question: 'You have a workspace with a semantic model that connects to an on-premises SQL Server database. What component is strictly required to schedule automatic data refreshes in the Power BI Service?',
        options: [
            'Power BI Desktop',
            'On-premises Data Gateway (Personal or Standard)',
            'Azure Key Vault Service',
            'Service Principal authorization token'
        ],
        answer: 'On-premises Data Gateway (Personal or Standard)',
        explanation: 'To connect cloud services (like Power BI Service) to on-premises data sources (like on-prem SQL Server), you must install and configure an On-premises Data Gateway to securely proxy the queries.'
    },
    {
        type: 'MultipleChoice',
        category: 'Prepare the data',
        difficulty: 'Easy',
        question: 'In Power Query, you want to combine two tables containing the same column structure but representing different years of data (2024 and 2025) into a single consolidated table. Which transformation should you apply?',
        options: [
            'Merge Queries',
            'Append Queries',
            'Transpose',
            'Pivot Column'
        ],
        answer: 'Append Queries',
        explanation: 'Appending queries stack rows from one table onto another (union operation), which is ideal for tables with identical structures. Merging queries acts like a database join (adding columns).'
    },
    {
        type: 'MultipleChoice',
        category: 'Model the data',
        difficulty: 'Medium',
        question: 'Why should you prefer using star schemas instead of flat single-table models or highly normalized snowflake schemas in Power BI?',
        options: [
            'Star schemas require more memory and slow down calculation times',
            'Star schemas optimize query performance (VertiPaq engine), simplify DAX calculations, and improve dashboard clarity',
            'Star schemas only work with direct query connections',
            'Star schemas prevent the use of relationships'
        ],
        answer: 'Star schemas optimize query performance (VertiPaq engine), simplify DAX calculations, and improve dashboard clarity',
        explanation: 'Star schemas (composed of central Fact tables and surrounding Dimension tables) provide the most efficient data structure for the VertiPaq tabular database, improving performance, relationships, and ease of writing DAX.'
    },
    {
        type: 'MultipleChoice',
        category: 'Visualize and analyze the data',
        difficulty: 'Medium',
        question: 'A report consumer wants to explore sales metrics by expanding hierarchies from "Category" down to "Subcategory" and then down to "Product" dynamically in a flow diagram. Which visual should you choose?',
        options: [
            'Matrix Visual',
            'Decomposition Tree',
            'Key Influencers',
            'Funnel Chart'
        ],
        answer: 'Decomposition Tree',
        explanation: 'The decomposition tree visual in Power BI lets you visualize data across multiple dimensions. It automatically aggregates data and enables drilling down into your dimensions in any order.'
    },
    {
        type: 'MultipleChoice',
        category: 'Deploy and maintain assets',
        difficulty: 'Hard',
        question: 'You want to allow external users to read your Power BI reports without assigning individual Power BI Pro or Premium Per User (PPU) licenses to them. Which licensing capability is required?',
        options: [
            'Power BI Pro for everyone',
            'Power BI Premium Capacity (P SKU or F SKU with F64 or larger)',
            'Power BI Free workspace',
            'Azure SQL database premium tier'
        ],
        answer: 'Power BI Premium Capacity (P SKU or F SKU with F64 or larger)',
        explanation: 'When workspace content is allocated to Premium Capacity (or Fabric F64+ capacity), users with free licenses can view reports without needing Pro/PPU licenses.'
    }
];
