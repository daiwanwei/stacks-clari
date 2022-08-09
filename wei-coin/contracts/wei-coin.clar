(impl-trait .sip010-ft-trait.ft-trait)
;; wei-coin
;; <add a description here>

;; constants
;;
(define-fungible-token wei-coin u10000000)
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u101))
(define-constant err-not-token-owner (err u102))

;; data maps and vars
;;

;; private functions
;;

;; public functions
;;
(define-read-only (get-total-supply) 
    (ok (ft-get-supply wei-coin))
)

(define-read-only (get-name) (ok "Wei Coin"))

(define-read-only (get-symbol) (ok "WC"))

(define-read-only (get-decimals) (ok u6))

(define-read-only (get-balances (who principal)) 
    (ok (ft-get-balance wei-coin who))
)

(define-public (get-token-uri) 
    (ok (some u"uri"))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)))) 
    (begin 
        (asserts! (is-eq tx-sender sender) err-owner-only)
        (try! (ft-transfer? wei-coin amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(define-public (mint (amount uint) (recipient principal)) 
    (begin 
        (asserts! (is-eq tx-sender contract-caller) err-owner-only)
        (ft-mint? wei-coin amount recipient)
    )
)
