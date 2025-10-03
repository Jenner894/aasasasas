        let currentStep = 1;
        const totalSteps = 4;
        let quoteData = {
            pageType: null,
            designLevel: null,
            options: [],
            totalPrice: 0,
            pricing: {}
        };

        // Charger la configuration des prix depuis l'API
        let pricingConfig = null;

        async function loadPricingConfig() {
            try {
                const response = await fetch('/api/pricing-config');
                const data = await response.json();
                if (data.success) {
                    pricingConfig = data.config;
                    console.log('Configuration des prix chargée:', pricingConfig);
                }
            } catch (error) {
                console.error('Erreur chargement config:', error);
            }
        }

        // Charger la config au démarrage
        loadPricingConfig();

        // Navigation entre les étapes
        document.getElementById('nextBtn').addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    showStep(currentStep);
                }
            }
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });

        function showStep(step) {
            // Cacher toutes les étapes
            document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
            document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');

            // Mettre à jour les indicateurs
            document.querySelectorAll('.step').forEach(s => {
                s.classList.remove('active', 'completed');
                const stepNum = parseInt(s.dataset.step);
                if (stepNum === step) {
                    s.classList.add('active');
                } else if (stepNum < step) {
                    s.classList.add('completed');
                    s.querySelector('.step-number').textContent = '';
                } else {
                    s.querySelector('.step-number').textContent = stepNum;
                }
            });

            // Mettre à jour la barre de progression
            const progress = ((step - 1) / (totalSteps - 1)) * 80; // 80% max pour ne pas toucher le dernier step
            document.getElementById('progressBar').style.width = progress + '%';

            // Gérer l'affichage des boutons
            document.getElementById('prevBtn').style.display = step > 1 ? 'block' : 'none';
            document.getElementById('nextBtn').style.display = step < totalSteps ? 'block' : 'none';
            document.getElementById('submitBtn').style.display = step === totalSteps ? 'block' : 'none';

            // Scroll vers le haut sur mobile
            if (window.innerWidth < 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        function validateStep(step) {
            if (step === 1 && !quoteData.pageType) {
                alert('⚠️ Veuillez sélectionner un type de landing page');
                return false;
            }
            if (step === 2 && !quoteData.designLevel) {
                alert('⚠️ Veuillez sélectionner un niveau de personnalisation');
                return false;
            }
            return true;
        }

        // Gestion des sélections radio
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                // Retirer la sélection visuelle des autres cartes
                this.closest('.option-grid').querySelectorAll('.option-card').forEach(card => {
                    card.classList.remove('selected');
                });
                this.closest('.option-card').classList.add('selected');

                // Enregistrer la sélection
                if (this.name === 'pageType') {
                    quoteData.pageType = this.value;
                } else if (this.name === 'designLevel') {
                    quoteData.designLevel = this.value;
                }
                
                updateSummary();
            });
        });

        // Gestion des checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    this.closest('.checkbox-option').classList.add('selected');
                    quoteData.options.push({
                        name: this.value,
                        price: parseInt(this.dataset.price)
                    });
                } else {
                    this.closest('.checkbox-option').classList.remove('selected');
                    quoteData.options = quoteData.options.filter(opt => opt.name !== this.value);
                }
                updateSummary();
            });
        });

        function updateSummary() {
            let total = 0;
            const summaryItems = document.getElementById('summaryItems');
            summaryItems.innerHTML = '';

            quoteData.pricing = {
                basePrice: 0,
                designPrice: 0,
                optionsPrice: 0,
                urgentFee: 0
            };

            // Type de page
            if (quoteData.pageType) {
                const pageTypeInput = document.querySelector(`input[name="pageType"][value="${quoteData.pageType}"]`);
                const price = parseInt(pageTypeInput.dataset.price);
                total += price;
                quoteData.pricing.basePrice = price;
                
                const labels = {
                    simple: 'Page Simple',
                    standard: 'Page Standard',
                    complete: 'Page Complète',
                    multipage: 'Site Multi-pages'
                };
                
                addSummaryItem(labels[quoteData.pageType], price);
            }

            // Niveau de design
            if (quoteData.designLevel) {
                const designInput = document.querySelector(`input[name="designLevel"][value="${quoteData.designLevel}"]`);
                const price = parseInt(designInput.dataset.price);
                if (price > 0) {
                    total += price;
                    quoteData.pricing.designPrice = price;
                    
                    const labels = {
                        template: 'Template Adapté',
                        custom: 'Design Sur-Mesure',
                        premium: 'Design Premium',
                        luxury: 'Design Luxe'
                    };
                    
                    addSummaryItem(labels[quoteData.designLevel], price);
                }
            }

            // Options
            let optionsTotal = 0;
            quoteData.options.forEach(opt => {
                total += opt.price;
                optionsTotal += opt.price;
                
                const labels = {
                    animations: 'Animations Avancées',
                    seo: 'Optimisation SEO',
                    analytics: 'Analytics & Tracking',
                    crm: 'Intégration CRM',
                    copywriting: 'Copywriting Pro',
                    multilingual: 'Version Multilingue',
                    maintenance: 'Maintenance Mensuelle'
                };
                
                addSummaryItem(labels[opt.name], opt.price);
            });
            quoteData.pricing.optionsPrice = optionsTotal;

            // Vérifier le délai urgent
            const deadlineSelect = document.querySelector('select[name="deadline"]');
            if (deadlineSelect && deadlineSelect.value === 'urgent' && total > 0) {
                const urgentFee = Math.round(total * 0.3);
                addSummaryItem('⚡ Livraison Express 72h', urgentFee, true);
                total += urgentFee;
                quoteData.pricing.urgentFee = urgentFee;
            }

            // Affichage par défaut si aucune sélection
            if (summaryItems.children.length === 0) {
                summaryItems.innerHTML = '<div class="summary-item"><span class="summary-item-label">Aucune sélection</span><span class="summary-item-value">-</span></div>';
            }

            // Mettre à jour le total
            quoteData.totalPrice = total;
            quoteData.pricing.totalPrice = total;
            
            document.getElementById('totalAmount').textContent = total.toLocaleString('fr-FR') + '€';
            
            if (total > 0) {
                const minRange = Math.round(total * 0.9);
                const maxRange = Math.round(total * 1.1);
                document.getElementById('totalRange').textContent = `Fourchette: ${minRange.toLocaleString('fr-FR')}€ - ${maxRange.toLocaleString('fr-FR')}€`;
                quoteData.pricing.priceRange = { min: minRange, max: maxRange };
            } else {
                document.getElementById('totalRange').textContent = 'Sélectionnez vos options';
            }
        }

        function addSummaryItem(label, price, isWarning = false) {
            const summaryItems = document.getElementById('summaryItems');
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `
                <span class="summary-item-label" style="${isWarning ? 'color: var(--color-warning);' : ''}">${label}</span>
                <span class="summary-item-value" style="${isWarning ? 'color: var(--color-warning);' : ''}">${price > 0 ? '+' : ''}${price.toLocaleString('fr-FR')}€</span>
            `;
            summaryItems.appendChild(item);
        }

        // Gestion de la soumission du formulaire
        document.getElementById('quoteForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const submitText = document.getElementById('submitText');
            const submitLoader = document.getElementById('submitLoader');
            
            // Désactiver le bouton et afficher le loader
            submitBtn.disabled = true;
            submitText.style.display = 'none';
            submitLoader.style.display = 'inline-block';
            
            const formData = new FormData(this);
            const requestData = {
                clientInfo: {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone') || '',
                    company: formData.get('company') || ''
                },
                projectDetails: {
                    pageType: quoteData.pageType,
                    designLevel: quoteData.designLevel,
                    options: quoteData.options,
                    deadline: formData.get('deadline'),
                    details: formData.get('details') || ''
                },
                pricing: quoteData.pricing
            };

            try {
                const response = await fetch('/api/submit-quote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'},
                    body: JSON.stringify(requestData)
                });

                const result = await response.json();

                if (result.success) {
                    // Masquer le formulaire et afficher le message de succès
                    document.getElementById('quoteForm').style.display = 'none';
                    document.querySelector('.step-indicator').style.display = 'none';
                    document.getElementById('successMessage').classList.add('show');
                    
                    // Masquer le CTA du résumé
                    document.querySelector('.summary-cta').style.display = 'none';
                    
                    console.log('Devis envoyé avec succès:', result.quoteId);
                } else {
                    throw new Error(result.error || 'Erreur lors de l\'envoi');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('❌ Erreur lors de l\'envoi de votre demande. Veuillez réessayer ou nous contacter directement.');
                
                // Réactiver le bouton
                submitBtn.disabled = false;
                submitText.style.display = 'inline-block';
                submitLoader.style.display = 'none';
            }
        });

        // Mise à jour du délai (pour le supplément urgent)
        document.querySelector('select[name="deadline"]').addEventListener('change', updateSummary);

        // Initialisation
        showStep(1);
        updateSummary();
